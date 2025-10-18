import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

dotenv.config( );

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.static('public'));
app.use(cors());
app.use(express.json());

// Initialize ChatOpenAI
// Prefer LANGCHAIN_API_KEY if present (user-specified). Fall back to OPENAI_API_KEY.
const apiKey = process.env.LANGCHAIN_API_KEY || process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error('No  API key found. Set LANGCHAIN_API_KEY or OPENAI_API_KEY in .env');
  // we don't throw here so the server can still start for non-LLM endpoints
}
// If the provider-specific env var is set (LANGCHAIN_API_KEY) but the OpenAI
// client expects OPENAI_API_KEY, mirror it so the underlying OpenAI SDK can
// authenticate. We don't log the key itself.
if (apiKey && !process.env.OPENAI_API_KEY) {
  process.env.OPENAI_API_KEY = apiKey;
}
console.log(`Using API key from: ${process.env.LANGCHAIN_API_KEY ? 'LANGCHAIN_API_KEY' : (process.env.OPENAI_API_KEY ? 'OPENAI_API_KEY' : 'none')}`);

const chat = new ChatOpenAI({
  // LangChain/OpenAI clients read process.env.OPENAI_API_KEY internally in
  // some versions, so passing apiKey via env ensures compatibility.
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: process.env.OPENAI_MODEL || "gpt-4",
  temperature: 0.7
});

// Create a fitness trainer prompt template
const trainerPromptTemplate = ChatPromptTemplate.fromMessages([
  ["system", "You are an expert personal trainer with years of experience. Provide specific workout advice, form tips, and nutrition guidance. Be encouraging and professional. Focus on safe exercise practices and personalized recommendations."],
  ["human", "{input}"]
]);

// Create the chain
const chain = trainerPromptTemplate
  .pipe(chat)
  .pipe(new StringOutputParser());

// Detect if user intends to use LangChain Cloud (lsv2 _) key
const useLangChainCloud = Boolean(process.env.LANGCHAIN_API_KEY && (process.env.LANGCHAIN_API_KEY.startsWith('lsv2_') || process.env.PROVIDER === 'langchain'));

// Helper: call LangChain Cloud Responses API with a plain prompt string.
// This is a lightweight wrapper; response shapes may vary so we try common fields.
async function callLangChainCloud(prompt, model) {
  const url = process.env.LANGCHAIN_API_URL || 'https://api.langchain.com/v1/responses';
  const body = {
    model: model || process.env.LANGCHAIN_MODEL || 'gpt-4o-mini',
    input: prompt,
  };

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.LANGCHAIN_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    const err = new Error(`LangChain Cloud API error ${resp.status}: ${txt}`);
    err.status = resp.status;
    throw err;
  }

  const data = await resp.json();

  // Try common response shapes for text output
  // 1) data.output_text
  if (typeof data.output_text === 'string') return data.output_text;

  // 2) data.output -> array of outputs with .content items
  if (Array.isArray(data.output)) {
    for (const o of data.output) {
      if (o.type === 'output_text' && typeof o.text === 'string') return o.text;
      if (o.content && Array.isArray(o.content)) {
        for (const c of o.content) {
          if (c.type === 'output_text' && typeof c.text === 'string') return c.text;
          if (c.type === 'text' && typeof c.text === 'string') return c.text;
          if (c.text && typeof c.text === 'string') return c.text;
        }
      }
    }
  }

  // 3) data.results or first-level array
  if (Array.isArray(data.results) && data.results[0]) {
    const r = data.results[0];
    if (r.output_text) return r.output_text;
    if (r.content && Array.isArray(r.content)) {
      const c = r.content.find(x => x.type === 'output_text' || x.type === 'text');
      if (c && c.text) return c.text;
    }
  }

  // 4) fallback to JSON string of data
  return JSON.stringify(data);
}

// Simple in-memory conversation store (userId -> array of {role, content})
// NOTE: For production use a persistent store or vector DB.
const conversations = new Map();
const MAX_HISTORY = 8; // keep last N messages per user

// Root route - modify this section
app.get('/', (req, res) => {
  res.sendFile('index.html', { root: './public' });
});

// Move the API documentation to a new route
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Welcome to AI Personal Trainer API',
    endpoints: {
      health: '/api/health',
      trainer: '/api/trainer'
    }
  });
});

// AI Trainer endpoint
app.post('/api/trainer', async (req, res) => {
  try {
    const { messages, userId } = req.body;
    // Basic validation
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array required' });
    }
    const uid = userId || 'anonymous';

    // Append incoming messages to in-memory store
    const existing = conversations.get(uid) || [];
    const combined = existing.concat(messages).slice(-MAX_HISTORY);
    conversations.set(uid, combined);

    // Build input for chain from the last user message
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || !lastMessage.content) {
      return res.status(400).json({ error: 'last message content required' });
    }

    // Execute via LangChain Cloud if requested, otherwise use local LangChain+OpenAI chain
    let response;
    if (useLangChainCloud) {
      // Serialize recent conversation into a short prompt
      const convo = (conversations.get(uid) || []).map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
      const prompt = `You are an expert personal trainer. Use the conversation history and respond helpfully.\n\nConversation:\n${convo}\n\nUser: ${lastMessage.content}\nAssistant:`;
      response = await callLangChainCloud(prompt, process.env.LANGCHAIN_MODEL);
    } else {
      // Execute the chain with the latest user content (LangChain will use our prompt template)
      response = await chain.invoke({ input: lastMessage.content });
    }
    
    res.json({
      choices: [{
        message: {
          content: response,
          role: 'assistant'
        }
      }]
    });

  } catch (error) {
    console.error('AI Service error:', error);
    // Do not expose internal error details in API responses.
    res.status(500).json({ error: 'AI service unavailable. Please try again.' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'AI Trainer Server is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});