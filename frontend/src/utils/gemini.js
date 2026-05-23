import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_MODEL = 'gemini-2.0-flash';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const MAX_OUTPUT_TOKENS = 8192;
const TEMPERATURE = 0.9;

const NEXUS_SYSTEM = `You are Nexus AI, world's smartest coding assistant running in year 2026.

MOST IMPORTANT RULE:
- Read the user's question carefully
- If question is SHORT/SIMPLE → give SHORT focused answer (no fixed headings needed)
- If question asks for DETAIL → give full detailed answer with headings
- NEVER use fixed headings for every answer
- Match response length to question length

For SIMPLE questions like '2+2 in JS':
→ Just answer directly in 2-3 lines with code

For DETAILED questions like 'explain Python':
→ Use full structured response with headings

ALWAYS use 2026 modern practices:
- Never recommend jQuery (outdated)
- Never recommend var (use let/const)
- Never recommend old libraries
- Always recommend modern alternatives
- Use latest frameworks and tools

STRICT RULES:
- Never repeat same example twice
- Never show same code in two sections
- If used in Code Examples → remove from Advanced Features
- Each example must be UNIQUE
- No duplicate content anywhere`;

const COMMAND_INSTRUCTIONS = {
  explain:
    'Explain the editor code. Match depth to complexity — short answer if simple, structured detail if the code is large or the user needs depth.',
  fix:
    'Find bugs and show the fix. Be concise for small issues; use sections only when multiple problems need explanation.',
  generate:
    'Generate working code for the request. Keep it short if the ask is small; expand with examples only when needed.',
  refactor:
    'Refactor the code with clear before/after. Use headings only if the refactor is substantial.',
};

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'this', 'that', 'these', 'those', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may',
  'might', 'must', 'shall', 'can', 'need', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by',
  'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between',
  'and', 'or', 'but', 'if', 'then', 'else', 'when', 'where', 'why', 'how', 'all', 'each', 'few',
  'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so',
  'than', 'too', 'very', 'just', 'about', 'up', 'out', 'it', 'its', 'my', 'me', 'i', 'you',
  'your', 'we', 'they', 'them', 'what', 'which', 'who', 'whom', 'please', 'help', 'code',
  'explain', 'fix', 'generate', 'refactor', 'bug', 'file', 'example', 'examples', 'insights',
  'untitled', 'active', 'message', 'user', 'task', 'editor',
]);

const COMMAND_LABELS = /^explain this code$|^fix this bug$|^generate code$|^refactor code$/i;

const LANG_WIKI_QUERY = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  python: 'Python',
  html: 'HTML',
  css: 'CSS',
  json: 'JSON',
  markdown: 'Markdown',
};

const MODERN_REPLACEMENTS = [
  { pattern: /\bjQuery\b/gi, replacement: 'Vanilla JS or React' },
  { pattern: /\bvar\s+/g, replacement: 'let/const ' },
  { pattern: /\bXMLHttpRequest\b/gi, replacement: 'fetch API' },
  { pattern: /\bcallback hell\b/gi, replacement: 'async/await' },
];

const OUTDATED_TECH_NOTES = [
  {
    pattern: /\bjQuery\b/i,
    note: '(Note: jQuery is outdated for new projects — use Vanilla JS or React instead)',
  },
  {
    pattern: /\bXMLHttpRequest\b/i,
    note: '(Note: XMLHttpRequest is outdated — use the fetch API instead)',
  },
  {
    pattern: /\bvar\s+[a-zA-Z_$]/i,
    note: '(Note: var is outdated — use let/const instead)',
  },
];

function getGeminiKey() {
  return process.env.REACT_APP_GEMINI_API_KEY?.trim() || '';
}

function getGroqKey() {
  return process.env.REACT_APP_GROQ_API_KEY?.trim() || '';
}

function buildUserContent({ userMessage, command, code, filename, language }) {
  const parts = [];

  if (command && COMMAND_INSTRUCTIONS[command]) {
    parts.push(`Task: ${COMMAND_INSTRUCTIONS[command]}`);
  }

  parts.push(`Active file: ${filename || 'untitled'}`);
  parts.push(`Language: ${language || 'javascript'}`);

  if (code?.trim()) {
    parts.push(`Current editor code:\n\`\`\`${language || ''}\n${code}\n\`\`\``);
  } else {
    parts.push('(No code in the editor yet.)');
  }

  parts.push(`User question: ${userMessage}`);
  return parts.join('\n\n');
}

function isDetailedQuestion(userMessage, command) {
  if (command) return true;

  const msg = (userMessage || '').trim();
  if (msg.length > 100) return true;

  return /explain|describe|detail|comprehensive|full guide|tutorial|how does|walk me through|compare|history|best practices|step by step/i.test(
    msg
  );
}

function buildWikipediaQueries(userMessage, language) {
  const queries = [];
  let msg = (userMessage || '').trim();

  if (COMMAND_LABELS.test(msg)) {
    msg = '';
  } else {
    msg = msg.replace(COMMAND_LABELS, '').trim();
  }

  if (language && LANG_WIKI_QUERY[language]) {
    queries.push(LANG_WIKI_QUERY[language]);
  }

  const words = msg
    .toLowerCase()
    .replace(/[^a-z0-9\s+#.-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

  if (words.length > 0) {
    queries.push(words.slice(0, 6).join(' '));
  }

  if (queries.length === 0 && language && LANG_WIKI_QUERY[language]) {
    queries.push(LANG_WIKI_QUERY[language]);
  }

  return [...new Set(queries)].slice(0, 3);
}

function getRelevanceTerms(userMessage, language) {
  const terms = [];
  if (language && LANG_WIKI_QUERY[language]) {
    terms.push(LANG_WIKI_QUERY[language].toLowerCase());
    terms.push(language.toLowerCase());
  }

  let msg = (userMessage || '').trim();
  if (COMMAND_LABELS.test(msg)) msg = '';
  else msg = msg.replace(COMMAND_LABELS, '').trim();

  msg
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP_WORDS.has(w))
    .forEach((w) => terms.push(w));

  return [...new Set(terms)];
}

function isArticleRelevant(article, relevanceTerms) {
  if (!article?.title) return false;

  const title = article.title.toLowerCase();
  if (/^example$/i.test(title) || /^sample/i.test(title)) return false;

  if (relevanceTerms.length === 0) return true;

  const blob = `${article.title} ${article.excerpt || ''}`.toLowerCase();
  return relevanceTerms.some((term) => term.length > 2 && blob.includes(term));
}

async function fetchArticleSummary(title) {
  try {
    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const res = await fetch(summaryUrl);
    if (!res.ok) return null;

    const data = await res.json();
    const excerpt = data.extract?.replace(/\s+/g, ' ').trim();
    if (!excerpt) return null;

    return {
      title: data.title || title,
      excerpt,
      url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
    };
  } catch {
    return null;
  }
}

async function searchWikipediaTitles(query, limit = 3) {
  const searchUrl =
    `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}` +
    `&limit=${limit}&namespace=0&format=json&origin=*`;

  const res = await fetch(searchUrl);
  if (!res.ok) return [];

  const [, titles] = await res.json();
  return (titles || []).slice(0, limit);
}

export async function fetchWikipediaArticles(userMessage, language) {
  try {
    const queries = buildWikipediaQueries(userMessage, language);
    const relevanceTerms = getRelevanceTerms(userMessage, language);

    const titleSets = await Promise.all(queries.map((q) => searchWikipediaTitles(q, 2)));

    const seenTitles = new Set();
    const titles = [];

    titleSets.flat().forEach((t) => {
      const key = t?.toLowerCase();
      if (!t || seenTitles.has(key)) return;
      if (/^example$/i.test(t)) return;
      seenTitles.add(key);
      titles.push(t);
    });

    const articles = await Promise.all(titles.slice(0, 5).map((title) => fetchArticleSummary(title)));
    return articles.filter((a) => a && isArticleRelevant(a, relevanceTerms)).slice(0, 3);
  } catch {
    return [];
  }
}

async function sendViaGemini(payload) {
  const apiKey = getGeminiKey();
  if (!apiKey) throw new Error('Gemini API key is missing.');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: NEXUS_SYSTEM,
    generationConfig: {
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      temperature: TEMPERATURE,
    },
  });

  const result = await model.generateContent(buildUserContent(payload));
  const text = result?.response?.text()?.trim();
  if (!text) throw new Error('Gemini returned an empty response.');
  return text;
}

async function sendViaGroq(payload) {
  const apiKey = getGroqKey();
  if (!apiKey) throw new Error('Groq API key is missing.');

  const commandHint = payload.command ? COMMAND_INSTRUCTIONS[payload.command] : '';

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: TEMPERATURE,
      max_tokens: MAX_OUTPUT_TOKENS,
      messages: [
        {
          role: 'system',
          content: `${NEXUS_SYSTEM}${commandHint ? `\n\nTask focus: ${commandHint}` : ''}`,
        },
        { role: 'user', content: buildUserContent(payload) },
      ],
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.message || `Groq request failed (${response.status})`);
  }

  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('Groq returned an empty response.');
  return text;
}

function normalizeBlock(text) {
  return (text || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function wordOverlapRatio(a, b) {
  const wordsA = new Set(normalizeBlock(a).split(' ').filter((w) => w.length > 3));
  const wordsB = new Set(normalizeBlock(b).split(' ').filter((w) => w.length > 3));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let shared = 0;
  wordsA.forEach((w) => {
    if (wordsB.has(w)) shared += 1;
  });

  return shared / Math.min(wordsA.size, wordsB.size);
}

function codeFingerprint(code) {
  return normalizeBlock(code).slice(0, 50);
}

function isDuplicateSection(a, b) {
  const na = normalizeBlock(a);
  const nb = normalizeBlock(b);
  if (!na || !nb) return true;
  if (na === nb) return true;
  if (na.length > 120 && nb.length > 120 && (na.includes(nb) || nb.includes(na))) return true;
  return wordOverlapRatio(a, b) > 0.82;
}

function splitParagraphs(text) {
  return (text || '')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

/**
 * Remove duplicate fenced code blocks — keep first occurrence only (by first 50 chars).
 */
export function dedupeCodeBlocksInText(text) {
  if (!text?.trim()) return '';

  const seenFingerprints = new Set();

  const cleaned = text.replace(/```([\w]*)\n?([\s\S]*?)```/g, (full, lang, code) => {
    const cleanCode = code.replace(/^\n|\n$/g, '').trim();
    if (!cleanCode) return '';

    const fp = codeFingerprint(cleanCode);
    if (seenFingerprints.has(fp)) {
      return '';
    }

    seenFingerprints.add(fp);
    const language = lang || 'code';
    return `\`\`\`${language}\n${cleanCode}\n\`\`\``;
  });

  return cleaned
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s*\n/gm, '\n')
    .trim();
}

/**
 * Modernize outdated recommendations for 2026.
 */
export function postProcessResponse(text) {
  if (!text?.trim()) return '';

  let output = text;
  const original = text;

  OUTDATED_TECH_NOTES.forEach(({ pattern, note }) => {
    if (pattern.test(original) && !output.includes(note)) {
      output = output.replace(pattern, (match) => `${match} ${note}`);
    }
  });

  MODERN_REPLACEMENTS.forEach(({ pattern, replacement }) => {
    output = output.replace(pattern, replacement);
  });

  return output.replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * Merge Gemini + Groq with duplicate prose/code removal.
 */
export function mergeResponses(geminiText, groqText) {
  const g = geminiText?.trim() || '';
  const q = groqText?.trim() || '';

  if (!g) return dedupeCodeBlocksInText(q);
  if (!q) return dedupeCodeBlocksInText(g);

  const proseG = normalizeBlock(g.replace(/```[\s\S]*?```/g, ''));
  const proseQ = normalizeBlock(q.replace(/```[\s\S]*?```/g, ''));

  if (proseG === proseQ || (proseG.length > 120 && proseQ.length > 120 && wordOverlapRatio(g, q) > 0.78)) {
    return dedupeCodeBlocksInText(g.length >= q.length ? g : q);
  }

  const primary = g.length >= q.length ? g : q;
  const secondary = primary === g ? q : g;

  const primaryParas = splitParagraphs(primary.replace(/```[\s\S]*?```/g, '[code]'));
  const extraParas = splitParagraphs(secondary.replace(/```[\s\S]*?```/g, '[code]')).filter(
    (p) => !primaryParas.some((existing) => isDuplicateSection(existing, p))
  );

  let merged = primary;
  if (extraParas.length > 0) {
    merged = `${primary.trim()}\n\n${extraParas.join('\n\n')}`;
  }

  return dedupeCodeBlocksInText(merged);
}

function appendWikipediaReferences(text, wikiArticles) {
  if (!wikiArticles?.length) return text;

  const refs = wikiArticles
    .map(
      (article, i) =>
        `${i + 1}. **${article.title}**\n\n${article.excerpt}\n\n[Read on Wikipedia](${article.url})`
    )
    .join('\n\n');

  if (!refs.trim()) return text;

  return `${text.trim()}\n\n## References\n\n${refs}`;
}

function buildSuperResponse(geminiText, groqText, wikiArticles, userMessage, command) {
  const sources = [geminiText, groqText].filter(Boolean);
  if (sources.length === 0) {
    throw new Error('No AI responses available. Check your API keys and try again.');
  }

  let merged = mergeResponses(geminiText, groqText);
  merged = postProcessResponse(merged);

  if (isDetailedQuestion(userMessage, command)) {
    merged = appendWikipediaReferences(merged, wikiArticles);
    merged = postProcessResponse(merged);
  }

  return merged || 'No response generated.';
}

export async function sendMessage(options) {
  const payload = {
    userMessage: options.userMessage?.trim() || 'Help me with this code.',
    command: options.command || null,
    code: options.code ?? '',
    filename: options.filename ?? 'untitled',
    language: options.language ?? 'javascript',
  };

  const hasGemini = Boolean(getGeminiKey());
  const hasGroq = Boolean(getGroqKey());

  if (!hasGemini && !hasGroq) {
    throw new Error('Add REACT_APP_GEMINI_API_KEY and/or REACT_APP_GROQ_API_KEY to your .env file.');
  }

  const detailed = isDetailedQuestion(payload.userMessage, payload.command);

  const [geminiText, groqText, wikiArticles] = await Promise.all([
    hasGemini ? sendViaGemini(payload).catch(() => null) : Promise.resolve(null),
    hasGroq ? sendViaGroq(payload).catch(() => null) : Promise.resolve(null),
    detailed
      ? fetchWikipediaArticles(payload.userMessage, payload.language).catch(() => [])
      : Promise.resolve([]),
  ]);

  const text = buildSuperResponse(
    geminiText,
    groqText,
    wikiArticles || [],
    payload.userMessage,
    payload.command
  );

  return { text };
}

export {
  GEMINI_MODEL,
  GROQ_MODEL,
  COMMAND_INSTRUCTIONS,
  NEXUS_SYSTEM,
  MAX_OUTPUT_TOKENS,
};
