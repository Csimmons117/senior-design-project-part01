// ---------- Environment Setup ----------
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

const MOCK = process.env.AI_MOCK === "true";

// ---------- Imports ----------
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import cookieParser from "cookie-parser";
import Database from "better-sqlite3";

// ---------- Database Setup ----------
const db = new Database(path.join(__dirname, "trainer.db"));
db.pragma("journal_mode = WAL"); // Better performance for concurrent access

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

console.log("✅ Database initialized");

// ---------- JWT Config ----------
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";
const JWT_EXPIRES = "15m";
const REFRESH_EXPIRES = "7d";

// ---------- Express Setup ----------
const app = express();
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000"],
  credentials: true
}));
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

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
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY missing. Set it in server/.env or enable AI_MOCK=true for mock mode.");
    process.exit(1);
  }
  console.log("Environment loaded. Using real OpenAI via LangChain...");

  const { ChatOpenAI } = await import("@langchain/openai");
  const { ChatPromptTemplate } = await import("@langchain/core/prompts");
  const { RunnableSequence } = await import("@langchain/core/runnables");
  const { HumanMessage } = await import("@langchain/core/messages");

  const llm = new ChatOpenAI({
    model: "gpt-4o-mini",
    temperature: 0.7,
    apiKey: process.env.OPENAI_API_KEY,
  });

  const visionLlm = new ChatOpenAI({
    model: "gpt-4o-mini",
    temperature: 0.7,
    apiKey: process.env.OPENAI_API_KEY,
  });

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are a friendly, safe fitness coach.
Return concise, actionable workout guidance including warm-up, main sets, cooldown, and form cues.
Adjust intensity to user's experience if mentioned.
If medical concerns arise, recommend consulting a professional.
When listing exercises, put the exercise name in **bold** format.
{userContext}`
    ],
    ["human", "{question}"]
  ]);

  const chain = RunnableSequence.from([prompt, llm]);
  getReply = async (question, userContext = "") => {
    const aiMsg = await chain.invoke({ question, userContext });
    return aiMsg.content;
  };

  analyzeImage = async (imageBase64, userPrompt = "Analyze my exercise form") => {
    const message = new HumanMessage({
      content: [
        {
          type: "text",
          text: `You are a professional fitness coach analyzing exercise form. ${userPrompt}

Provide specific, actionable feedback on:
1. What they're doing well
2. What needs improvement
3. Safety concerns (if any)
4. Specific form cues to help them improve

Be encouraging but honest. If you can't clearly see the exercise or form, say so.`
        },
        {
          type: "image_url",
          image_url: { url: imageBase64 }
        }
      ]
    });

    const response = await visionLlm.invoke([message]);
    return response.content;
  };
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
    const message = req.body?.message ?? "";
    if (!message) return res.status(400).json({ error: "Missing message" });

    // Get user context for personalization
    let userContext = "";
    if (req.user) {
      const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.userId);
      userContext = buildUserContext(user);
    }

    const reply = await getReply(message, userContext);
    res.json({ reply });
  } catch (e) {
    const detail = e?.response?.data || e?.cause?.response?.data || e?.message || String(e);
    console.error("Chat error:", detail);
    res.status(502).json({ error: "Chat failed", detail });
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
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT} (mock=${MOCK})`);
});
