// ---------- Environment Setup ----------
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

const MOCK = process.env.AI_MOCK === "false";

// ---------- Imports ----------
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import cookieParser from "cookie-parser";
import Database from "better-sqlite3";
import nodemailer from "nodemailer";

// ---------- Database Setup ----------
const db = new Database(path.join(__dirname, "trainer.db"));
db.pragma("journal_mode = WAL"); // Better performance for concurrent access

const CHAT_RETENTION_DAYS = 30;
const CHAT_RETENTION_SECONDS = CHAT_RETENTION_DAYS * 24 * 60 * 60;

// Create users table
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    avatar_url TEXT,
    height_cm INTEGER,
    weight_kg REAL,
    fitness_goal TEXT,
    experience_level TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

  // Create password_resets table
  db.exec(`
    CREATE TABLE IF NOT EXISTS password_resets (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s','now'))
    )
  `);

// Create chat history table
db.exec(`
  CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_chat_messages_user_created
  ON chat_messages(user_id, created_at)
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_chat_messages_expires
  ON chat_messages(expires_at)
`);

console.log("✅ Database initialized");

function cleanupExpiredChatHistory() {
  const now = Math.floor(Date.now() / 1000);
  const result = db.prepare("DELETE FROM chat_messages WHERE expires_at <= ?").run(now);
  if (result.changes > 0) {
    console.log(`🧹 Cleaned up ${result.changes} expired chat messages`);
  }
}

cleanupExpiredChatHistory();

// ---------- JWT Config ----------
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";
const JWT_EXPIRES = "15m";
const REFRESH_EXPIRES = "7d";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:8000",
  "http://localhost:80",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:8000",
  "http://127.0.0.1:80",
  "null" // file:// protocol in browsers
];

const ALLOWED_ORIGINS = [
  ...new Set([
    ...DEFAULT_ALLOWED_ORIGINS,
    FRONTEND_URL,
    ...(process.env.ALLOWED_ORIGINS || "")
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean)
  ])
];

// ---------- Express Setup ----------
const app = express();
app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (curl, health checks, server-to-server)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true
}));
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

console.log("Allowed CORS origins:", ALLOWED_ORIGINS);

// SMTP / nodemailer setup (optional)
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
const SMTP_SECURE = process.env.SMTP_SECURE === "true";
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const FROM_EMAIL = process.env.FROM_EMAIL || `noreply@${process.env.DOMAIN || "localhost"}`;

let mailer = null;
if (SMTP_HOST && SMTP_PORT) {
  mailer = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined
  });
  mailer.verify()
    .then(() => console.log("✅ SMTP transporter ready"))
    .catch((err) => console.warn("⚠️ SMTP verify failed:", err.message));
}

async function sendResetEmail(to, resetUrl) {
  if (!mailer) {
    console.log("No SMTP configured; reset URL:", resetUrl);
    return;
  }

  const html = `<p>You requested a password reset for your account. This link will expire in 1 hour.</p><p><a href="${resetUrl}">Reset your password</a></p><p>If you didn't request this, ignore this email.</p>`;

  try {
    await mailer.sendMail({
      from: FROM_EMAIL,
      to,
      subject: "CSUN AI Fitness - Password reset",
      html
    });
    console.log("Password reset email sent to", to);
  } catch (e) {
    console.error("Failed to send reset email:", e.message || e);
  }
}

// ---------- Auth Middleware ----------
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = decoded;
    next();
  });
}

// Optional auth - doesn't fail if no token, but attaches user if valid
function optionalAuth(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token) {
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (!err) {
        req.user = decoded;
      }
    });
  }
  next();
}

// ---------- Mock + Real LLM Setup ----------
let getReply;
let analyzeImage;

function mockReply(question, userContext = "") {
  const q = (question || "").trim();
  return [
    "Mock Coach (no billing):",
    userContext ? `\n[Personalized for: ${userContext}]\n` : "",
    "Warm-up (5 min)",
    "- 2 min brisk walk or easy cycle",
    "- Dynamic stretches: leg swings, arm circles",
    "",
    "Main (20 min) - 3 rounds",
    "1) **Barbell Squats** (3x8-10)",
    "2) **Leg Press** (3x10-12)",
    "3) **Romanian Deadlifts** (3x10-12)",
    "4) **Leg Extensions** (3x12-15)",
    "5) **Hamstring Curls** (3x12-15)",
    "",
    "Cooldown (5 min)",
    "- Slow walk + light quad/hamstring/calf stretches",
    "",
    "Form cues",
    "- Neutral spine, core braced, controlled reps, full range of motion",
    "",
    q ? `Prompt: "${q}"` : ""
  ].join("\n");
}

function mockImageAnalysis(prompt) {
  return [
    "Mock Form Analysis (no billing):",
    "",
    "Good points:",
    "- Neutral spine position",
    "- Knees tracking over toes",
    "- Good depth on the squat",
    "",
    "Areas to improve:",
    "- Keep chest more upright",
    "- Engage core throughout the movement",
    "- Ensure weight is distributed evenly on feet",
    "",
    prompt ? `Analysis for: "${prompt}"` : ""
  ].join("\n");
}

if (MOCK) {
  console.log("Running in MOCK mode (AI_MOCK=true). No API calls will be made.");
  getReply = async (question, userContext) => mockReply(question, userContext);
  analyzeImage = async (imageBase64, prompt) => mockImageAnalysis(prompt);
} else {
  if (!process.env.GROQ_API_KEY) {
    console.error("GROQ_API_KEY missing. Set it in server/.env or enable AI_MOCK=true for mock mode.");
    process.exit(1);
  }

  const Groq = (await import("groq-sdk")).default;
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  const FITNESS_SYSTEM_PROMPT = `You are a friendly, safe fitness coach.
Return concise, actionable workout guidance including warm-up, main sets, cooldown, and form cues.
Adjust intensity to user's experience if mentioned.
If medical concerns arise, recommend consulting a professional.
When listing exercises, put the exercise name in **bold** format.`;

  console.log(`Environment loaded. Using Groq API (model=${GROQ_MODEL}).`);

  getReply = async (question, userContext = "") => {
    const systemContent = userContext?.trim()
      ? `${FITNESS_SYSTEM_PROMPT}\n\n${userContext.trim()}`
      : FITNESS_SYSTEM_PROMPT;

    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: systemContent },
        { role: "user", content: question || "" }
      ],
      temperature: 0.7
    });

    return completion.choices[0]?.message?.content ?? "";
  };

  // Vision not wired to Groq yet; keep local mock so the camera flow still works.
  analyzeImage = async (_imageBase64, prompt) => mockImageAnalysis(prompt);
}

// ---------- Helper Functions ----------
function buildUserContext(user) {
  if (!user) return "";
  const parts = [];
  if (user.name) parts.push(`User: ${user.name}`);
  if (user.height_cm) parts.push(`Height: ${user.height_cm}cm`);
  if (user.weight_kg) parts.push(`Weight: ${user.weight_kg}kg`);
  if (user.fitness_goal) parts.push(`Goal: ${user.fitness_goal}`);
  if (user.experience_level) parts.push(`Experience: ${user.experience_level}`);
  return parts.length > 0 ? `[User Profile: ${parts.join(", ")}]` : "";
}

function generateTokens(user) {
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
  const refreshToken = jwt.sign(
    { userId: user.id, type: "refresh" },
    JWT_SECRET,
    { expiresIn: REFRESH_EXPIRES }
  );
  return { accessToken, refreshToken };
}

function sanitizeUser(user) {
  if (!user) return null;
  const { password_hash, ...safeUser } = user;
  return safeUser;
}

// ---------- Auth Routes ----------

// Signup
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { email, password, name, height_cm, weight_kg, fitness_goal, experience_level } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Email, password, and name are required" });
    }

    // CSUN email validation
    const emailLower = email.toLowerCase();
    if (!emailLower.endsWith("@csun.edu") && !emailLower.endsWith("@my.csun.edu")) {
      return res.status(400).json({ error: "Must use a CSUN email address (@csun.edu or @my.csun.edu)" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    // Check if user exists
    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(emailLower);
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    // Create user
    const id = uuidv4();
    const password_hash = await bcrypt.hash(password, 10);

    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, height_cm, weight_kg, fitness_goal, experience_level)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, emailLower, password_hash, name, height_cm || null, weight_kg || null, fitness_goal || null, experience_level || null);

    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
    const { accessToken, refreshToken } = generateTokens(user);

    // Set refresh token as httpOnly cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      user: sanitizeUser(user),
      accessToken
    });
  } catch (e) {
    console.error("Signup error:", e);
    res.status(500).json({ error: "Signup failed", detail: e.message });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const emailLower = email.toLowerCase();
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(emailLower);

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const { accessToken, refreshToken } = generateTokens(user);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      user: sanitizeUser(user),
      accessToken
    });
  } catch (e) {
    console.error("Login error:", e);
    res.status(500).json({ error: "Login failed", detail: e.message });
  }
});

// Refresh token
app.post("/api/auth/refresh", (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ error: "No refresh token" });
    }

    jwt.verify(refreshToken, JWT_SECRET, (err, decoded) => {
      if (err || decoded.type !== "refresh") {
        return res.status(403).json({ error: "Invalid refresh token" });
      }

      const user = db.prepare("SELECT * FROM users WHERE id = ?").get(decoded.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.json({
        user: sanitizeUser(user),
        accessToken
      });
    });
  } catch (e) {
    console.error("Refresh error:", e);
    res.status(500).json({ error: "Token refresh failed" });
  }
});

// Logout
app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("refreshToken");
  res.json({ ok: true });
});

// Forgot password - request a reset token
app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const emailLower = email.toLowerCase();
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(emailLower);

    // Always return success to avoid leaking which emails exist
    if (!user) {
      return res.json({ ok: true });
    }

    const token = uuidv4();
    const expires_at = Math.floor(Date.now() / 1000) + 60 * 60; // 1 hour

    db.prepare(`INSERT INTO password_resets (token, user_id, expires_at) VALUES (?, ?, ?)`)
      .run(token, user.id, expires_at);

    const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;

    // In production you should send the resetUrl via email. For development we log it.
    console.log(`Password reset requested for ${emailLower}: ${resetUrl}`);

    // Send email if SMTP is configured (best-effort)
    try {
      await sendResetEmail(emailLower, resetUrl);
    } catch (e) {
      console.error('Error sending reset email:', e.message || e);
    }

    const resp = { ok: true };
    if (process.env.NODE_ENV !== "production") resp.resetUrl = resetUrl;
    res.json(resp);
  } catch (e) {
    console.error("Forgot password error:", e);
    res.status(500).json({ error: "Failed to create password reset" });
  }
});

// Reset password - supply token and new password
app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ error: "Token and newPassword required" });
    if (newPassword.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });

    const row = db.prepare("SELECT * FROM password_resets WHERE token = ?").get(token);
    if (!row) return res.status(400).json({ error: "Invalid or expired token" });

    const now = Math.floor(Date.now() / 1000);
    if (now > row.expires_at) {
      // delete expired token
      db.prepare("DELETE FROM password_resets WHERE token = ?").run(token);
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(row.user_id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const password_hash = await bcrypt.hash(newPassword, 10);
    db.prepare("UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .run(password_hash, user.id);

    // Remove any outstanding reset tokens for this user
    db.prepare("DELETE FROM password_resets WHERE user_id = ?").run(user.id);

    res.json({ ok: true });
  } catch (e) {
    console.error("Reset password error:", e);
    res.status(500).json({ error: "Failed to reset password" });
  }
});

// ---------- User Profile Routes ----------

// Get profile
app.get("/api/user/profile", authenticateToken, (req, res) => {
  try {
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ user: sanitizeUser(user) });
  } catch (e) {
    console.error("Profile fetch error:", e);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// Update profile
app.put("/api/user/profile", authenticateToken, (req, res) => {
  try {
    const { name, height_cm, weight_kg, fitness_goal, experience_level } = req.body;

    db.prepare(`
      UPDATE users
      SET name = COALESCE(?, name),
          height_cm = ?,
          weight_kg = ?,
          fitness_goal = ?,
          experience_level = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, height_cm || null, weight_kg || null, fitness_goal || null, experience_level || null, req.user.userId);

    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.userId);
    res.json({ user: sanitizeUser(user) });
  } catch (e) {
    console.error("Profile update error:", e);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// Update avatar
app.post("/api/user/avatar", authenticateToken, (req, res) => {
  try {
    const { avatar_url } = req.body;

    db.prepare(`
      UPDATE users SET avatar_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(avatar_url || null, req.user.userId);

    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.userId);
    res.json({ user: sanitizeUser(user) });
  } catch (e) {
    console.error("Avatar update error:", e);
    res.status(500).json({ error: "Failed to update avatar" });
  }
});

// ---------- Health & Diagnostic Routes ----------
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, mock: MOCK });
});

app.get("/api/diag", async (_req, res) => {
  try {
    const reply = await getReply("Say 'pong'.");
    res.json({ ok: true, mock: MOCK, reply });
  } catch (e) {
    const detail = e?.response?.data || e?.cause?.response?.data || e?.message || String(e);
    console.error("Diag failed:", detail);
    res.status(500).json({ ok: false, error: "Diag failed", detail });
  }
});

// ---------- Chat Routes (with personalization) ----------

app.post("/api/trainer", optionalAuth, async (req, res) => {
  try {
    const question = req.body?.prompt ?? req.body?.messages?.[0]?.content ?? "";
    if (!question) return res.status(400).json({ error: "Missing prompt" });

    // Get user context for personalization
    let userContext = "";
    if (req.user) {
      const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.userId);
      userContext = buildUserContext(user);
    }

    const reply = await getReply(question, userContext);
    res.json({ reply });
  } catch (e) {
    const detail = e?.response?.data || e?.cause?.response?.data || e?.message || String(e);
    console.error("LangChain error:", detail);
    res.status(502).json({ error: "Model call failed", detail });
  }
});

// Chat endpoint (used by frontend) - with personalization
app.post("/api/chat", optionalAuth, async (req, res) => {
  try {
    cleanupExpiredChatHistory();

    const message = req.body?.message ?? "";
    if (!message) return res.status(400).json({ error: "Missing message" });

    // Get user context for personalization
    let userContext = "";
    let userId = null;
    if (req.user) {
      const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.userId);
      userContext = buildUserContext(user);
      userId = user?.id || null;
    }

    const reply = await getReply(message, userContext);

    // Save chat only for authenticated users
    if (userId) {
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = now + CHAT_RETENTION_SECONDS;
      const insertMessage = db.prepare(`
        INSERT INTO chat_messages (id, user_id, role, content, created_at, expires_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      const insertMany = db.transaction((messages) => {
        for (const item of messages) {
          insertMessage.run(uuidv4(), userId, item.role, item.content, now, expiresAt);
        }
      });

      insertMany([
        { role: "user", content: message },
        { role: "assistant", content: String(reply ?? "") }
      ]);
    }

    res.json({ reply });
  } catch (e) {
    const detail = e?.response?.data || e?.cause?.response?.data || e?.message || String(e);
    console.error("Chat error:", detail);
    res.status(502).json({ error: "Chat failed", detail });
  }
});

// Chat history for the authenticated user (last 30 days)
app.get("/api/chat/history", authenticateToken, (req, res) => {
  try {
    cleanupExpiredChatHistory();

    const rows = db.prepare(`
      SELECT role, content, created_at
      FROM chat_messages
      WHERE user_id = ?
      ORDER BY created_at ASC
    `).all(req.user.userId);

    const messages = rows.map((row) => ({
      role: row.role,
      content: row.content,
      createdAt: row.created_at
    }));

    res.json({ messages });
  } catch (e) {
    console.error("Chat history fetch error:", e);
    res.status(500).json({ error: "Failed to fetch chat history" });
  }
});

// Image analysis endpoint
app.post("/api/analyze-form", optionalAuth, async (req, res) => {
  try {
    const { image, prompt } = req.body;
    if (!image) return res.status(400).json({ error: "Missing image data" });

    if (!image.startsWith("data:image/")) {
      return res.status(400).json({ error: "Invalid image format. Expected base64 data URL" });
    }

    const reply = await analyzeImage(image, prompt || "Analyze my exercise form");
    res.json({ reply });
  } catch (e) {
    const detail = e?.response?.data || e?.cause?.response?.data || e?.message || String(e);
    console.error("Image analysis error:", detail);
    res.status(502).json({ error: "Image analysis failed", detail });
  }
});

// ---------- Start ----------
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT} (mock=${MOCK})`);
});
