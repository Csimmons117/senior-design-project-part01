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

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase limit for base64 images

// ---------- Mock + Real LLM Setup ----------
let getReply; // async (question) => string
let analyzeImage; // async (imageBase64, prompt) => string

function mockReply(question) {
  const q = (question || "").trim();
  return [
    "Mock Coach (no billing):",
    "",
    "Warm-up (5 min)",
    "- 2 min brisk walk or easy cycle",
    "- Dynamic stretches: leg swings, arm circles",
    "",
    "Main (20 min) — 3 rounds",
    "1) Squats × 12  •  2) Push-ups × 10  •  3) Bent-over rows × 12",
    "4) Plank 30–45s •  Rest 60s between rounds",
    "",
    "Cooldown (5 min)",
    "- Slow walk + light quad/hamstring/calf stretches",
    "",
    "Form cues",
    "- Neutral spine, core braced, controlled reps, full range of motion",
    "",
    q ? `Prompt: “${q}”` : ""
  ].join("\n");
}

function mockImageAnalysis(prompt) {
  return [
    "Mock Form Analysis (no billing):",
    "",
    "✅ Good points:",
    "- Neutral spine position",
    "- Knees tracking over toes",
    "- Good depth on the squat",
    "",
    "⚠️ Areas to improve:",
    "- Keep chest more upright",
    "- Engage core throughout the movement",
    "- Ensure weight is distributed evenly on feet",
    "",
    prompt ? `Analysis for: "${prompt}"` : ""
  ].join("\n");
}

if (MOCK) {
  console.log("🧪 Running in MOCK mode (AI_MOCK=true). No API calls will be made.");
  getReply = async (question) => mockReply(question);
  analyzeImage = async (imageBase64, prompt) => mockImageAnalysis(prompt);
} else {
  // Real model path (requires billing + OPENAI_API_KEY)
  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY missing. Set it in server/.env or enable AI_MOCK=true for mock mode.");
    process.exit(1);
  }
  console.log("✅ Environment loaded. Using real OpenAI via LangChain...");

  const { ChatOpenAI } = await import("@langchain/openai");
  const { ChatPromptTemplate } = await import("@langchain/core/prompts");
  const { RunnableSequence } = await import("@langchain/core/runnables");
  const { HumanMessage } = await import("@langchain/core/messages");

  const llm = new ChatOpenAI({
    model: "gpt-4o-mini",
    temperature: 0.7,
    apiKey: process.env.OPENAI_API_KEY,
    // project: process.env.OPENAI_PROJECT, // uncomment if your org uses Projects
  });

  // Vision model for image analysis
  const visionLlm = new ChatOpenAI({
    model: "gpt-4o-mini", // gpt-4o-mini supports vision
    temperature: 0.7,
    apiKey: process.env.OPENAI_API_KEY,
  });

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are a friendly, safe fitness coach.
Return concise, actionable workout guidance including warm-up, main sets, cooldown, and form cues.
Adjust intensity to user's experience if mentioned.
If medical concerns arise, recommend consulting a professional.`
    ],
    ["human", "{question}"]
  ]);

  const chain = RunnableSequence.from([prompt, llm]);
  getReply = async (question) => {
    const aiMsg = await chain.invoke({ question });
    return aiMsg.content;
  };

  // Image analysis function
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

// ---------- Routes ----------
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, mock: MOCK });
});

app.get("/api/diag", async (_req, res) => {
  try {
    const reply = await getReply(`Say 'pong'.`);
    res.json({ ok: true, mock: MOCK, reply });
  } catch (e) {
    const detail =
      e?.response?.data || e?.cause?.response?.data || e?.message || String(e);
    console.error("❌ Diag failed:", detail);
    res.status(500).json({ ok: false, error: "Diag failed", detail });
  }
});

app.post("/api/trainer", async (req, res) => {
  try {
    const question = req.body?.prompt ?? req.body?.messages?.[0]?.content ?? "";
    if (!question) return res.status(400).json({ error: "Missing prompt" });

    const reply = await getReply(question);
    res.json({ reply });
  } catch (e) {
    const detail =
      e?.response?.data || e?.cause?.response?.data || e?.message || String(e);
    console.error("❌ LangChain error:", detail);
    res.status(502).json({ error: "Model call failed", detail });
  }
});

// Chat endpoint (used by frontend)
app.post("/api/chat", async (req, res) => {
  try {
    const message = req.body?.message ?? "";
    if (!message) return res.status(400).json({ error: "Missing message" });

    const reply = await getReply(message);
    res.json({ reply });
  } catch (e) {
    const detail =
      e?.response?.data || e?.cause?.response?.data || e?.message || String(e);
    console.error("❌ Chat error:", detail);
    res.status(502).json({ error: "Chat failed", detail });
  }
});

// Image analysis endpoint
app.post("/api/analyze-form", async (req, res) => {
  try {
    const { image, prompt } = req.body;
    if (!image) return res.status(400).json({ error: "Missing image data" });

    // Validate base64 image format
    if (!image.startsWith('data:image/')) {
      return res.status(400).json({ error: "Invalid image format. Expected base64 data URL" });
    }

    const reply = await analyzeImage(image, prompt || "Analyze my exercise form");
    res.json({ reply });
  } catch (e) {
    const detail =
      e?.response?.data || e?.cause?.response?.data || e?.message || String(e);
    console.error("❌ Image analysis error:", detail);
    res.status(502).json({ error: "Image analysis failed", detail });
  }
});

// ---------- Start ----------
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT} (mock=${MOCK})`);
});
