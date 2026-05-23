import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_MODEL = 'gemini-2.0-flash';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const MAX_OUTPUT_TOKENS = 8192;
const TEMPERATURE = 0.9;

const NEXUS_SYSTEM = `You are Nexus AI, world's smartest coding assistant running in year 2026.

Write like a human expert — natural, clear, and flowing (similar to ChatGPT).

RESPONSE STYLE:
- Read the user's question first. Match length and depth to what they actually asked.
- SHORT or simple question → short direct answer in plain prose. No headings. No essay.
- Longer or "explain" style question → fuller answer. You may add markdown headings ONLY if they genuinely help — choose your own titles (do NOT use a fixed template like Introduction, Background, Core Concepts, Advanced Features, etc.).
- Never force headings on every answer. Never use a rigid section checklist.

Example — simple: "2+2 in JavaScript" → 2–3 lines with a tiny code snippet.
Example — detailed: "Explain Python decorators" → natural explanation; add headings only where useful.

EDITOR CODE:
- If the user message is general (no editor code was provided in context), answer directly — do not paste or discuss their open file.
- Only analyze, fix, or quote their editor code when they asked about it (explain/fix/refactor commands or "my code", "this code", etc.).

2026 MODERN PRACTICES:
- Never recommend jQuery, var, XMLHttpRequest, or other outdated patterns
- Prefer let/const, fetch, async/await, and current frameworks

QUALITY:
- No duplicate examples or repeated code blocks
- Each code sample should appear once
- Be accurate and practical`;

const COMMAND_INSTRUCTIONS = {
  explain:
    'Explain the editor code naturally. Short if the code is small; go deeper only when needed. No template headings.',
  fix:
    'Find bugs and show the fix clearly. Be brief unless multiple issues need separation.',
  generate:
    'Generate working code for the request. Keep it proportional to what was asked.',
  refactor:
    'Refactor with clear before/after. Write in a natural expert voice — headings only if they help.',
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

/** Exact Wikipedia search phrases for known topics (message topic wins over editor language). */
const TOPIC_WIKI_SEARCH = {
  python: 'Python programming language',
  javascript: 'JavaScript programming language',
  typescript: 'TypeScript programming language',
  react: 'React JavaScript library',
  vue: 'Vue.js JavaScript framework',
  angular: 'Angular web framework',
  nodejs: 'Node.js JavaScript runtime',
  node: 'Node.js JavaScript runtime',
  java: 'Java programming language',
  rust: 'Rust programming language',
  go: 'Go programming language',
  golang: 'Go programming language',
  ruby: 'Ruby programming language',
  php: 'PHP programming language',
  swift: 'Swift programming language',
  kotlin: 'Kotlin programming language',
  django: 'Django web framework',
  flask: 'Flask web framework Python',
  fastapi: 'FastAPI Python framework',
  html: 'HTML markup language',
  css: 'CSS stylesheet language',
  sql: 'SQL database language',
  mongodb: 'MongoDB database',
  postgresql: 'PostgreSQL database',
  docker: 'Docker software',
  kubernetes: 'Kubernetes',
};

const TOPIC_DETECT_ORDER = [
  'typescript',
  'javascript',
  'fastapi',
  'kubernetes',
  'postgresql',
  'mongodb',
  'python',
  'react',
  'angular',
  'vue',
  'nodejs',
  'node',
  'django',
  'flask',
  'golang',
  'kotlin',
  'swift',
  'rust',
  'ruby',
  'java',
  'docker',
  'php',
  'html',
  'css',
  'sql',
  'go',
];

const TOPIC_CONFLICTS = {
  python: ['javascript', 'typescript', 'react', 'vue', 'angular', 'java', 'node.js', 'nodejs'],
  javascript: ['python', 'java', 'rust', 'ruby', 'php'],
  typescript: ['python', 'java', 'ruby', 'php'],
  react: ['python', 'vue', 'angular', 'django', 'flask'],
  java: ['javascript', 'python', 'typescript', 'react'],
  rust: ['python', 'javascript', 'java'],
  go: ['python', 'javascript', 'java'],
  golang: ['python', 'javascript', 'java'],
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

function isAboutUserCode(userMessage, command) {
  if (command) return true;

  const msg = (userMessage || '').trim().toLowerCase();
  return (
    /my code|this code|the code|editor code|in my file|in this file|above code|below code|fix (this|my|the)|debug (this|my|the)|review (this|my|the)|refactor (this|my|the)|explain (this|my|the)|what.?s wrong|error in (my|this|the)|bug in (my|this|the)|issue in (my|this|the)|help with (this|my|the) code/i.test(
      msg
    ) || COMMAND_LABELS.test(msg)
  );
}

function isSimpleQuestion(userMessage, command) {
  if (isAboutUserCode(userMessage, command)) return false;

  const msg = (userMessage || '').trim();
  if (!msg) return true;

  if (msg.length > 100) return false;

  if (/explain|describe|detail|comprehensive|tutorial|walk me through|step by step|compare|history|best practices/i.test(msg)) {
    return false;
  }

  const wordCount = msg.split(/\s+/).filter(Boolean).length;
  return wordCount <= 14;
}

function shouldIncludeEditorCode(userMessage, command) {
  return isAboutUserCode(userMessage, command);
}

function buildUserContent({ userMessage, command, code, filename, language }) {
  const parts = [];
  const includeEditor = shouldIncludeEditorCode(userMessage, command);

  if (command && COMMAND_INSTRUCTIONS[command]) {
    parts.push(`Task: ${COMMAND_INSTRUCTIONS[command]}`);
  }

  if (includeEditor) {
    parts.push(`Active file: ${filename || 'untitled'}`);
    parts.push(`Language: ${language || 'javascript'}`);

    if (code?.trim()) {
      parts.push(`Current editor code:\n\`\`\`${language || ''}\n${code}\n\`\`\``);
    } else {
      parts.push('(No code in the editor yet.)');
    }
  } else {
    parts.push(
      'Answer the user question directly. Do not include or discuss code from the editor workspace — they are asking a general question, not about their open file.'
    );
  }

  parts.push(`User question: ${userMessage}`);
  return parts.join('\n\n');
}

function isDetailedQuestion(userMessage, command) {
  if (command) return true;
  if (isSimpleQuestion(userMessage, command)) return false;

  const msg = (userMessage || '').trim();
  if (msg.length > 100) return true;

  return /explain|describe|detail|comprehensive|full guide|tutorial|how does|walk me through|compare|history|best practices|step by step/i.test(
    msg
  );
}

function cleanUserMessageForTopic(userMessage) {
  let msg = (userMessage || '').trim();
  if (COMMAND_LABELS.test(msg)) return '';
  return msg.replace(COMMAND_LABELS, '').trim();
}

/**
 * Main topic from the user's question (not the editor default language when they named another tech).
 */
export function extractMainTopic(userMessage, editorLanguage) {
  const msg = cleanUserMessageForTopic(userMessage);
  const haystack = `${msg} ${userMessage || ''}`.toLowerCase();

  for (const key of TOPIC_DETECT_ORDER) {
    const re = new RegExp(`\\b${key.replace('.', '\\.')}\\b`, 'i');
    if (re.test(haystack)) {
      if (key === 'node' && /\bnodejs\b/i.test(haystack)) continue;
      return key === 'node' ? 'nodejs' : key;
    }
  }

  if (msg) {
    const words = msg
      .toLowerCase()
      .replace(/[^a-z0-9\s+#.-]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

    for (const word of words) {
      if (TOPIC_WIKI_SEARCH[word]) return word;
    }
  }

  if (editorLanguage && TOPIC_WIKI_SEARCH[editorLanguage]) {
    return editorLanguage;
  }

  return null;
}

function getWikipediaSearchQuery(topicKey) {
  if (!topicKey) return null;
  if (TOPIC_WIKI_SEARCH[topicKey]) return TOPIC_WIKI_SEARCH[topicKey];

  const label = topicKey.charAt(0).toUpperCase() + topicKey.slice(1);
  return `${label} programming language`;
}

function getTopicMatchTerms(topicKey) {
  const terms = [topicKey.toLowerCase()];
  if (topicKey === 'javascript') terms.push('ecmascript', 'js');
  if (topicKey === 'typescript') terms.push('typescript', 'ts');
  if (topicKey === 'python') terms.push('python');
  if (topicKey === 'react') terms.push('react');
  if (topicKey === 'nodejs' || topicKey === 'node') terms.push('node.js', 'nodejs');
  if (topicKey === 'golang' || topicKey === 'go') terms.push('go programming');
  return [...new Set(terms)];
}

function isArticleRelevantToTopic(article, topicKey) {
  if (!article?.title || !topicKey) return false;

  const title = article.title.toLowerCase();
  const excerpt = (article.excerpt || '').toLowerCase();
  const blob = `${title} ${excerpt}`;

  if (/^example$/i.test(title) || /^sample/i.test(title) || /^list of/i.test(title)) {
    return false;
  }

  const matchTerms = getTopicMatchTerms(topicKey);
  const matchesTopic = matchTerms.some((term) => {
    if (term.length <= 2) return false;
    if (term === 'go' || term === 'js') {
      return new RegExp(`\\b${term}\\b`, 'i').test(blob);
    }
    return blob.includes(term);
  });

  if (!matchesTopic) return false;

  const conflicts = TOPIC_CONFLICTS[topicKey] || [];
  for (const conflict of conflicts) {
    const conflictInTitle = title.includes(conflict);
    const topicInTitle = matchTerms.some((t) => t.length > 3 && title.includes(t));
    if (conflictInTitle && !topicInTitle) return false;
  }

  if (topicKey === 'python' && title.includes('javascript') && !title.includes('python')) {
    return false;
  }
  if (topicKey === 'javascript' && title === 'python' && !blob.includes('javascript')) {
    return false;
  }
  if (topicKey === 'react' && title.includes('python') && !title.includes('react')) {
    return false;
  }

  return true;
}

function buildWikipediaQueries(userMessage, editorLanguage) {
  const topicKey = extractMainTopic(userMessage, editorLanguage);
  const query = getWikipediaSearchQuery(topicKey);
  return query ? [{ query, topicKey }] : [];
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

export async function fetchWikipediaArticles(userMessage, editorLanguage) {
  try {
    const queryPlans = buildWikipediaQueries(userMessage, editorLanguage);
    if (queryPlans.length === 0) return [];

    const { query, topicKey } = queryPlans[0];
    const titles = await searchWikipediaTitles(query, 5);

    const seenTitles = new Set();
    const articles = [];

    for (const title of titles) {
      const key = title?.toLowerCase();
      if (!title || seenTitles.has(key)) continue;
      seenTitles.add(key);

      const article = await fetchArticleSummary(title);
      if (article && isArticleRelevantToTopic(article, topicKey)) {
        articles.push(article);
      }
      if (articles.length >= 2) break;
    }

    return articles;
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

function appendWikipediaReferences(text, wikiArticles, topicKey) {
  if (!wikiArticles?.length || !topicKey) return text;

  const refs = wikiArticles
    .map(
      (article, i) =>
        `${i + 1}. **${article.title}**\n\n${article.excerpt}\n\n[Read on Wikipedia](${article.url})`
    )
    .join('\n\n');

  if (!refs.trim()) return text;

  const topicLabel = TOPIC_WIKI_SEARCH[topicKey] || topicKey;
  return `${text.trim()}\n\nFurther reading on **${topicLabel.split(' ')[0]}**:\n\n${refs}`;
}

function buildSuperResponse(geminiText, groqText, wikiArticles, userMessage, command, editorLanguage) {
  const sources = [geminiText, groqText].filter(Boolean);
  if (sources.length === 0) {
    throw new Error('No AI responses available. Check your API keys and try again.');
  }

  let merged = mergeResponses(geminiText, groqText);
  merged = postProcessResponse(merged);

  if (isDetailedQuestion(userMessage, command) && wikiArticles.length > 0) {
    const topicKey = extractMainTopic(userMessage, editorLanguage);
    merged = appendWikipediaReferences(merged, wikiArticles, topicKey);
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
  const wikiTopic = extractMainTopic(payload.userMessage, payload.language);

  const [geminiText, groqText, wikiArticles] = await Promise.all([
    hasGemini ? sendViaGemini(payload).catch(() => null) : Promise.resolve(null),
    hasGroq ? sendViaGroq(payload).catch(() => null) : Promise.resolve(null),
    detailed && wikiTopic
      ? fetchWikipediaArticles(payload.userMessage, payload.language).catch(() => [])
      : Promise.resolve([]),
  ]);

  const text = buildSuperResponse(
    geminiText,
    groqText,
    wikiArticles || [],
    payload.userMessage,
    payload.command,
    payload.language
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
