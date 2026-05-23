import { GoogleGenerativeAI } from '@google/generative-ai';

const TAVILY_SEARCH_URL = 'https://api.tavily.com/search';

const GEMINI_MODEL = 'gemini-2.0-flash';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const MAX_OUTPUT_TOKENS = 8192;
const TEMPERATURE = 0.9;

const NEXUS_SYSTEM = `You are Nexus Ultra Engine (Nexus AI v2.0) — Principal-level engineering intelligence. Zero filler. Absolute precision.

## LAYOUT & MARKDOWN (CRITICAL)
- Never place prose and fenced code on the same line.
- Always insert a blank line (two newlines) before opening \`\`\` and after closing \`\`\`.
- Inline: wrap every variable, operator expression, keyword, and native identifier in backticks inside prose (e.g. \`2 + 2\`, \`useState\`, \`async\`).
- Multi-line code: language-tagged fences only. Never append a fence directly after a sentence.

## SHORT-FORM (strict brevity)
- Max 3 lines of prose OR one compact fenced block — not a crowded cluster.
- Direct answer: one key insight or one minimal snippet. No headings.

## LONG-FORM (8-step teaching sequence — use all steps for concept/architecture questions)
1. High-impact analogy (one line)
2. Complete production-grade definition
3. Structural contrast: Before vs After or Problem vs Solution (markdown table or clear blocks)
4. Foundation code (minimal, runnable, output comments required)
5. Under-the-hood mechanisms (execution/memory)
6. Enterprise real-world example (complete, no placeholders)
7. Edge cases and pro-tips
8. Crisp summary (max 3 lines) — hard stop

## TOPIC COMPLETENESS (when the question matches)
- React Hooks: \`useState\`, \`useEffect\`, custom hooks with real state mutations; contrast vs \`componentDidMount\` / class lifecycle.
- Async/Await: \`async\` returns a \`Promise\`; \`await\` pauses non-blockingly; \`try/catch\`; \`Promise.all()\` for parallelism; contrast vs \`.then()\` chains.
- Python list comprehensions: trailing \`# Output: [...]\` on every snippet; equivalent \`for\` loop; filters/transforms/nested on a realistic dataset.
- Python decorators: \`from functools import wraps\`, \`@wraps(func)\`, \`*args, **kwargs\`; map the wrapper transformation.

## CODE QUALITY
- Every block complete and runnable — no \`// code goes here\` or \`...\` placeholders.
- Declare exact runtime output in comments (\`// Output:\`, \`# Output:\`).
- Modern syntax only: no \`var\`, jQuery, or XMLHttpRequest unless explicitly requested.
- Python decorators: mandatory \`@wraps\`. Auth: no dummy \`return True\`.

## ERROR CORRECTION
If the user question embeds a false assumption or anti-pattern, correct it in one brief line before the main answer.

## WEB RESEARCH
Synthesize provided snippets naturally. Priority: MDN → Stack Overflow → GitHub → dev.to. No "Source:", no link dumps.

## EDITOR CODE
Only analyze open-file code when editor context was supplied.`;

const LONG_INSTRUCTIONAL =
  /\b(what is|how to|explain|why|examples|show me|difference|compare|when to use|how does|walk me through|best practices|step by step|tutorial|describe|detail)\b/i;

const ARCHITECTURAL_TOPICS =
  /\b(react|hooks?|useState|useEffect|async|await|decorators?|classes?|functions?|web\s*apis?|promise|componentDidMount|componentWillMount|lifecycle|jsx|typescript|generics?)\b/i;

const PURE_MATH_PATTERN = /^[\d\s+\-*/().=^%]+$/;

const SINGLE_PRIMITIVE_PATTERN =
  /^(var|let|const|function|async|await|null|undefined|true|false|this|super|import|export)$/i;

const BINARY_VALIDATION_PATTERN = /^is\s+.+\?\s*$/i;

const TOPIC_COMPLETENESS_RULES = {
  react_hooks:
    'React Hooks coverage required: useState, useEffect, custom hooks with real state updates; contrast hooks vs class lifecycle (componentDidMount, etc.).',
  async_await:
    'Async/Await coverage required: async returns Promise; await non-blocking pause; try/catch; Promise.all() for parallel work; contrast vs .then() chains.',
  python_comprehensions:
    'List comprehension coverage required: # Output: [...] on each snippet; equivalent for-loop; filters, transforms, nested logic on realistic data.',
  python_decorators:
    'Decorator coverage required: from functools import wraps, @wraps(func), *args/**kwargs; explain wrapper transformation.',
};

/** Official doc tier-1 pointers (synthesis hints, not link dumps in output). */
const OFFICIAL_DOC_HINTS = {
  python: 'https://docs.python.org/3/',
  javascript: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
  typescript: 'https://www.typescriptlang.org/docs/',
  react: 'https://react.dev/',
  vue: 'https://vuejs.org/guide/',
  angular: 'https://angular.dev/',
  nodejs: 'https://nodejs.org/docs/latest/api/',
  node: 'https://nodejs.org/docs/latest/api/',
  java: 'https://docs.oracle.com/en/java/',
  rust: 'https://doc.rust-lang.org/',
  go: 'https://go.dev/doc/',
  golang: 'https://go.dev/doc/',
  django: 'https://docs.djangoproject.com/',
  flask: 'https://flask.palletsprojects.com/',
  fastapi: 'https://fastapi.tiangolo.com/',
  html: 'https://developer.mozilla.org/en-US/docs/Web/HTML',
  css: 'https://developer.mozilla.org/en-US/docs/Web/CSS',
  sql: 'https://developer.mozilla.org/en-US/docs/Glossary/SQL',
  docker: 'https://docs.docker.com/',
  kubernetes: 'https://kubernetes.io/docs/',
};

const COMMAND_INSTRUCTIONS = {
  explain:
    'Explain the editor code with production-grade precision. Short if trivial; use layered teaching only when the concept warrants it.',
  fix:
    'Identify bugs, correct user misconceptions briefly, show the fix. Production-quality code only.',
  generate:
    'Generate production-ready code: modern patterns, realistic auth (no dummy return True), Python decorators with @wraps.',
  refactor:
    'Refactor with clear before/after contrast. Elite maintainability and modern stack only.',
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

const TAVILY_SEARCH_DOMAINS = [
  'developer.mozilla.org',
  'stackoverflow.com',
  'github.com',
  'dev.to',
  'python.org',
  'react.dev',
  'nodejs.org',
  'freecodecamp.org',
  'geeksforgeeks.org',
  'en.wikipedia.org',
];

/** Search query phrases for known topics (message topic wins over editor language). */
const TOPIC_SEARCH_QUERIES = {
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

function getTavilyKey() {
  return process.env.REACT_APP_TAVILY_API_KEY?.trim() || '';
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

export function isLongFormQuery(userMessage, command) {
  if (command) return true;
  if (isAboutUserCode(userMessage, command)) return true;

  const msg = (userMessage || '').trim();
  if (!msg) return false;

  const wordCount = msg.split(/\s+/).filter(Boolean).length;
  const lower = msg.toLowerCase();

  if (wordCount > 5) return true;
  if (LONG_INSTRUCTIONAL.test(lower)) return true;
  if (ARCHITECTURAL_TOPICS.test(lower)) return true;

  return false;
}

export function isShortFormQuery(userMessage, command) {
  if (isLongFormQuery(userMessage, command)) return false;

  const msg = (userMessage || '').trim();
  if (!msg) return true;

  const compact = msg.replace(/\s/g, '');
  if (PURE_MATH_PATTERN.test(compact)) return true;
  if (SINGLE_PRIMITIVE_PATTERN.test(msg)) return true;
  if (BINARY_VALIDATION_PATTERN.test(msg)) return true;

  const wordCount = msg.split(/\s+/).filter(Boolean).length;
  return wordCount <= 5;
}

function detectTopicCompletenessHints(userMessage) {
  const lower = (userMessage || '').toLowerCase();
  const hints = [];

  if (/\b(hooks?|useState|useEffect|componentDidMount)\b/.test(lower) || /\breact\b.*\bhook/.test(lower)) {
    hints.push(TOPIC_COMPLETENESS_RULES.react_hooks);
  }
  if (/\basync\b/.test(lower) || /\bawait\b/.test(lower) || /\bpromise\.all\b/i.test(lower)) {
    hints.push(TOPIC_COMPLETENESS_RULES.async_await);
  }
  if (
    /\blist comprehension\b/.test(lower) ||
    (/\bcomprehension\b/.test(lower) && /\bpython\b/.test(lower))
  ) {
    hints.push(TOPIC_COMPLETENESS_RULES.python_comprehensions);
  }
  if (/\bdecorator/.test(lower) && /\bpython\b/.test(lower)) {
    hints.push(TOPIC_COMPLETENESS_RULES.python_decorators);
  }

  return hints;
}

function detectQueryErrors(userMessage) {
  const msg = (userMessage || '').trim();
  if (!msg) return [];

  const corrections = [];

  if (/\bvar\b.*\b(?:best|recommended|modern|only)\b/i.test(msg) || /\bonly\s+var\b/i.test(msg)) {
    corrections.push('Correction: `var` is legacy — use `let` or `const` in modern JavaScript.');
  }
  if (/\bjquery\b.*\b(?:modern|recommended|best)\b/i.test(msg)) {
    corrections.push('Correction: jQuery is not recommended for new projects — use native DOM or React.');
  }
  if (/\bXMLHttpRequest\b.*\b(?:prefer|better|modern)\b/i.test(msg)) {
    corrections.push('Correction: prefer the `fetch` API over `XMLHttpRequest`.');
  }
  if (/\bpython\s+2\b/i.test(msg) && !/\bpython\s+3\b/i.test(msg)) {
    corrections.push('Correction: Python 2 is end-of-life — use Python 3.');
  }
  if (/\bawait\b/.test(msg) && /\bnon-?blocking\s+thread\b/i.test(msg)) {
    corrections.push('Correction: `await` pauses the async function, not the entire thread — the event loop stays non-blocking.');
  }

  return corrections;
}

export function detectIntent(userMessage, command) {
  const msg = (userMessage || '').toLowerCase();

  if (command === 'fix' || /\b(debug|error|bug|fix|broken|crash|stack trace)\b/.test(msg)) {
    return 'debugging';
  }
  if (command === 'generate' || /\b(write|generate|create|implement|build|scaffold)\b/.test(msg)) {
    return 'coding';
  }
  if (/\b(vs\.?|versus|compare|better|choose|trade.?off|which should)\b/.test(msg)) {
    return 'decision-making';
  }
  if (/\b(explain|how|why|learn|understand|tutorial|teach)\b/.test(msg) || command === 'explain') {
    return 'learning';
  }
  return 'fact';
}

function shouldIncludeEditorCode(userMessage, command) {
  return isAboutUserCode(userMessage, command);
}

function buildWebSearchQuery(userMessage, editorLanguage) {
  const cleaned = cleanUserMessageForTopic(userMessage) || (userMessage || '').trim();
  if (cleaned.length >= 8) return cleaned;

  const topicKey = extractMainTopic(userMessage, editorLanguage);
  if (topicKey && TOPIC_SEARCH_QUERIES[topicKey]) {
    return TOPIC_SEARCH_QUERIES[topicKey];
  }

  return cleaned;
}

/**
 * Tavily web search (REST API — same options as @tavily/core; CRA cannot bundle the SDK's Node deps).
 * Snippets are for RAG synthesis only; never appended as raw results to the user.
 */
export async function searchWeb(userMessage, editorLanguage) {
  const apiKey = getTavilyKey();
  if (!apiKey) return [];

  const query = buildWebSearchQuery(userMessage, editorLanguage)?.trim();
  if (!query) return [];

  try {
    const res = await fetch(TAVILY_SEARCH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        max_results: 5,
        search_depth: 'advanced',
        include_domains: TAVILY_SEARCH_DOMAINS,
      }),
    });

    if (!res.ok) return [];

    const data = await res.json();
    return (data?.results || [])
      .filter((r) => r?.content?.trim())
      .map((r) => ({
        title: r.title || 'Untitled',
        snippet: (r.content || '').replace(/\s+/g, ' ').trim().slice(0, 400),
      }));
  } catch {
    return [];
  }
}

function buildRagContext(webResults, topicKey) {
  const lines = [];

  const official = topicKey && OFFICIAL_DOC_HINTS[topicKey];
  if (official) {
    lines.push(`Official documentation: ${official}`);
  }

  if (webResults?.length) {
    webResults.forEach((hit) => {
      lines.push(`${hit.title}: ${hit.snippet}`);
    });
  }

  return lines.length ? lines.join('\n') : '';
}

function buildUserContent({ userMessage, command, code, filename, language, ragContext }) {
  const parts = [];
  const includeEditor = shouldIncludeEditorCode(userMessage, command);
  const shortForm = isShortFormQuery(userMessage, command);
  const longForm = isDetailedQuestion(userMessage, command);
  const intent = detectIntent(userMessage, command);

  const queryErrors = detectQueryErrors(userMessage);
  if (queryErrors.length) {
    parts.push(`User query corrections (state briefly at the start of your answer):\n${queryErrors.join('\n')}`);
  }

  if (shortForm) {
    parts.push(
      'RESPONSE MODE: SHORT-FORM. Max 3 prose lines OR one compact fenced block. No headings. Blank line before/after any fence. Backtick all inline code tokens.'
    );
  } else if (longForm) {
    parts.push(
      'RESPONSE MODE: LONG-FORM. Execute full 8-step sequence. Blank line before/after every fenced block. Every code block must include output comments and be runnable.'
    );
    parts.push(`Intent: ${intent}. Scale depth to inferred skill; include trade-offs when comparing options.`);

    const topicHints = detectTopicCompletenessHints(userMessage);
    if (topicHints.length) {
      parts.push(`Topic completeness (mandatory):\n${topicHints.join('\n')}`);
    }
  } else {
    parts.push(`Intent: ${intent}. Match depth to the question — concise unless they asked for depth.`);
  }

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
      'No editor code in context — answer directly. Do not paste or discuss their open file.'
    );
  }

  if (ragContext?.trim() && longForm) {
    parts.push(
      `Web research (integrate naturally into your answer; no "Source:", "Reference:", or link dumps):\n${ragContext}`
    );
  }

  parts.push(`User question: ${userMessage}`);
  return parts.join('\n\n');
}

function isDetailedQuestion(userMessage, command) {
  return isLongFormQuery(userMessage, command);
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
      if (TOPIC_SEARCH_QUERIES[word]) return word;
    }
  }

  if (editorLanguage && TOPIC_SEARCH_QUERIES[editorLanguage]) {
    return editorLanguage;
  }

  return null;
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
const FILLER_PATTERNS = [
  /\n+#{1,3}\s*Further reading[\s\S]*$/i,
  /\n+Further reading on[\s\S]*$/i,
  /\n+##\s*References\s*\n[\s\S]*$/i,
  /^\s*Source:\s*.+$/gim,
  /^\s*Reference:\s*.+$/gim,
  /You can confirm this by[\s\S]*?(?=\n\n|$)/gi,
  /As you can see,?\s*/gi,
  /It is worth noting that\s*/gi,
  /In conclusion,?\s*/gi,
];

/**
 * Physical isolation: dual newlines between prose and fenced code (zero token bleeding).
 */
export function enforceLayoutIsolation(text) {
  if (!text?.trim()) return '';

  let output = text.replace(/\r\n/g, '\n');

  output = output.replace(/([^\n`])\s*```/g, '$1\n\n```');

  return output.replace(/\n{3,}/g, '\n\n').trim();
}

const PLACEHOLDER_PATTERNS = [
  /\/\/\s*code goes here/gi,
  /\/\/\s*your code here/gi,
  /\/\/\s*todo:?\s*implement/gi,
  /#\s*code goes here/gi,
  /\/\*\s*\.\.\.\s*\*\//g,
];

function trimShortFormResponse(text) {
  const blocks = [];
  const src = text;
  let cursor = 0;

  while (cursor < src.length) {
    const openIdx = src.indexOf('```', cursor);
    if (openIdx === -1) {
      const tail = src.slice(cursor).trim();
      if (tail) blocks.push({ type: 'prose', content: tail });
      break;
    }
    const prose = src.slice(cursor, openIdx).trim();
    if (prose) blocks.push({ type: 'prose', content: prose });
    const closeIdx = src.indexOf('```', openIdx + 3);
    if (closeIdx === -1) {
      blocks.push({ type: 'code', content: src.slice(openIdx) });
      break;
    }
    blocks.push({ type: 'code', content: src.slice(openIdx, closeIdx + 3) });
    cursor = closeIdx + 3;
  }

  const proseLines = [];
  let codeBlock = null;

  blocks.forEach((b) => {
    if (b.type === 'code' && !codeBlock) codeBlock = b.content;
    if (b.type === 'prose') {
      b.content.split('\n').forEach((line) => {
        const t = line.trim();
        if (t) proseLines.push(t);
      });
    }
  });

  const trimmedProse = proseLines.slice(0, 3).join('\n');
  const parts = [];
  if (trimmedProse) parts.push(trimmedProse);
  if (codeBlock) {
    if (parts.length) parts.push('');
    parts.push(codeBlock);
  }

  return parts.join('\n').trim() || text.trim();
}

export function postProcessResponse(text, options = {}) {
  if (!text?.trim()) return '';

  const { shortForm = false } = options;
  let output = enforceLayoutIsolation(text);
  const original = text;

  FILLER_PATTERNS.forEach((pattern) => {
    output = output.replace(pattern, '');
  });

  PLACEHOLDER_PATTERNS.forEach((pattern) => {
    output = output.replace(pattern, '');
  });

  OUTDATED_TECH_NOTES.forEach(({ pattern, note }) => {
    if (pattern.test(original) && !output.includes(note)) {
      output = output.replace(pattern, (match) => `${match} ${note}`);
    }
  });

  MODERN_REPLACEMENTS.forEach(({ pattern, replacement }) => {
    output = output.replace(pattern, replacement);
  });

  output = dedupeCodeBlocksInText(output);
  output = enforceLayoutIsolation(output);

  if (shortForm) {
    output = trimShortFormResponse(output);
    output = enforceLayoutIsolation(output);
  }

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

function buildSuperResponse(geminiText, groqText, userMessage, command) {
  const sources = [geminiText, groqText].filter(Boolean);
  if (sources.length === 0) {
    throw new Error('No AI responses available. Check your API keys and try again.');
  }

  const shortForm = isShortFormQuery(userMessage, command);

  let merged = mergeResponses(geminiText, groqText);
  merged = postProcessResponse(merged, { shortForm });

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
  const topicKey = extractMainTopic(payload.userMessage, payload.language);

  const webResults = detailed
    ? await searchWeb(payload.userMessage, payload.language).catch(() => [])
    : [];

  const ragContext = detailed ? buildRagContext(webResults, topicKey) : '';
  const enrichedPayload = { ...payload, ragContext };

  const [geminiText, groqText] = await Promise.all([
    hasGemini ? sendViaGemini(enrichedPayload).catch(() => null) : Promise.resolve(null),
    hasGroq ? sendViaGroq(enrichedPayload).catch(() => null) : Promise.resolve(null),
  ]);

  const text = buildSuperResponse(
    geminiText,
    groqText,
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
