import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_MODEL = 'gemini-2.0-flash';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const COMMAND_INSTRUCTIONS = {
  explain:
    'Explain the provided code clearly. Cover purpose, key logic, and anything non-obvious. Use concise sections and short code references where helpful.',
  fix:
    'Find bugs or issues in the provided code. Explain each problem briefly, then show the corrected code in a fenced code block.',
  generate:
    'Generate clean, working code based on the user request and file context. Return the code in a fenced code block with brief notes if needed.',
  refactor:
    'Refactor the provided code for readability and maintainability without changing behavior. Show the refactored code in a fenced code block and summarize changes briefly.',
};

function getGeminiKey() {
  return process.env.REACT_APP_GEMINI_API_KEY?.trim() || '';
}

function getGroqKey() {
  return process.env.REACT_APP_GROQ_API_KEY?.trim() || '';
}

function buildUserContent({ userMessage, command, code, filename, language }) {
  const instruction = command ? COMMAND_INSTRUCTIONS[command] : null;
  const parts = [];

  if (instruction) {
    parts.push(`Task: ${instruction}`);
  }

  parts.push(`Active file: ${filename || 'untitled'}`);
  parts.push(`Language: ${language || 'javascript'}`);

  if (code?.trim()) {
    parts.push(`Current editor code:\n\`\`\`${language || ''}\n${code}\n\`\`\``);
  } else {
    parts.push('(No code in the editor yet.)');
  }

  parts.push(`User message: ${userMessage}`);
  return parts.join('\n\n');
}

async function sendViaGemini(payload) {
  const apiKey = getGeminiKey();
  if (!apiKey) {
    throw new Error('Gemini API key is missing. Add REACT_APP_GEMINI_API_KEY to your .env file.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction:
      'You are Nexus AI, an expert coding assistant inside a code editor. Be direct, accurate, and practical. Format code in markdown fences when showing code.',
  });

  const userContent = buildUserContent(payload);
  const result = await model.generateContent(userContent);
  const text = result?.response?.text();

  if (!text?.trim()) {
    throw new Error('Gemini returned an empty response.');
  }

  return { text: text.trim(), provider: 'gemini' };
}

async function sendViaGroq(payload) {
  const apiKey = getGroqKey();
  if (!apiKey) {
    throw new Error('Groq API key is missing. Add REACT_APP_GROQ_API_KEY to your .env file.');
  }

  const userContent = buildUserContent(payload);
  const commandHint = payload.command ? COMMAND_INSTRUCTIONS[payload.command] : '';

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.35,
      max_tokens: 4096,
      messages: [
        {
          role: 'system',
          content:
            'You are Nexus AI, an expert coding assistant inside a code editor. Be direct, accurate, and practical. Format code in markdown fences when showing code.' +
            (commandHint ? ` ${commandHint}` : ''),
        },
        { role: 'user', content: userContent },
      ],
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const msg = data?.error?.message || `Groq request failed (${response.status})`;
    throw new Error(msg);
  }

  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error('Groq returned an empty response.');
  }

  return { text, provider: 'groq' };
}

/**
 * Send a message to Gemini Flash; on failure, fall back to Groq if configured.
 * @param {Object} options
 * @param {string} options.userMessage
 * @param {string} [options.command] - explain | fix | generate | refactor
 * @param {string} [options.code]
 * @param {string} [options.filename]
 * @param {string} [options.language]
 * @returns {Promise<{ text: string, provider: 'gemini' | 'groq' }>}
 */
export async function sendMessage(options) {
  const payload = {
    userMessage: options.userMessage?.trim() || 'Help me with this code.',
    command: options.command || null,
    code: options.code ?? '',
    filename: options.filename ?? 'untitled',
    language: options.language ?? 'javascript',
  };

  let geminiError = null;

  try {
    return await sendViaGemini(payload);
  } catch (err) {
    geminiError = err instanceof Error ? err : new Error(String(err));
  }

  if (!getGroqKey()) {
    throw new Error(
      geminiError.message || 'Gemini request failed and no Groq fallback key is configured.'
    );
  }

  try {
    return await sendViaGroq(payload);
  } catch (groqError) {
    const groqMsg = groqError instanceof Error ? groqError.message : String(groqError);
    throw new Error(
      `Gemini failed: ${geminiError.message}. Groq fallback also failed: ${groqMsg}`
    );
  }
}

export { GEMINI_MODEL, GROQ_MODEL, COMMAND_INSTRUCTIONS };
