import { GoogleGenerativeAI } from '@google/generative-ai';

const TAVILY_SEARCH_URL = 'https://api.tavily.com/search';

const GEMINI_MODEL = 'gemini-2.0-flash';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const MAX_OUTPUT_TOKENS = 8192;
const TEMPERATURE = 0.9;

export const QUERY_TYPES = {
  FACTUAL: 'factual',
  CONCEPTUAL: 'conceptual',
  PROCEDURAL: 'procedural',
  DEEP: 'deep',
};

const NEXUS_SYSTEM = `You are Nexus Ultra Engine v3.0. Correctness over verbosity. Zero repetition. Zero filler.

LAYOUT: Blank line before and after every fenced code block. Inline tokens in backticks. Never glue prose to fences.

DOMAIN ISOLATION: Match code language to the question. React/JS questions → JavaScript/JSX only. Python questions → Python only. Never mix ecosystems unless comparing (label each side).

CODE: Runnable, complete, no placeholders. Template literals use backticks. Output comments ONLY for deterministic results (console.log, print). Never abstract UI output comments.

HEADINGS: Human and simple ("How it works", "Real example", "Code"). Ban buzzwords: enterprise, production-grade, high-impact, under-the-hood.

ANTI-REPETITION: Each sentence must add new information. Never restate the same fact.

UNCERTAINTY: If unsure, say so briefly. Do not invent APIs, outputs, or behavior.

WEB RESEARCH: Synthesize snippets naturally. No Source labels or link dumps.

EDITOR: Only discuss open-file code when editor context was provided.`;

const PURE_MATH_PATTERN = /^[\d\s+\-*/().=^%]+$/;
const SINGLE_PRIMITIVE_PATTERN =
  /^(var|let|const|function|async|await|null|undefined|true|false|this|super|import|export)$/i;
const BINARY_VALIDATION_PATTERN = /^is\s+.+\?\s*$/i;
const SHORT_WHAT_IS_PATTERN =
  /^what is (var|null|undefined|true|false|let|const|this|NaN|Infinity)\??\s*$/i;

const DEEP_SIGNALS =
  /\b(in detail|in depth|comprehensive|deep dive|step by step|walk me through|multiple examples|full guide|everything about)\b/i;
const COMPARE_SIGNALS = /\b(compare|vs\.?|versus|difference between)\b/i;
const PROCEDURAL_SIGNALS = /^how to\b|^how does\b|\bhow do i\b/i;
const CONCEPTUAL_SIGNALS = /^what is\b|^what are\b|^define\b/i;

const ARCHITECTURAL_TOPICS =
  /\b(react|hooks?|useState|useEffect|async|await|decorators?|classes?|functions?|web\s*apis?|promise|componentDidMount|lifecycle|jsx|comprehension)\b/i;

const PYTHON_DOMAIN = new Set(['python', 'django', 'flask', 'fastapi']);
const JS_DOMAIN = new Set([
  'javascript',
  'typescript',
  'react',
  'vue',
  'angular',
  'nodejs',
  'node',
]);

const TOPIC_COMPLETENESS_RULES = {
  react_hooks:
    'React Hooks (JS/JSX only): useState, useEffect, custom hook (useLocalStorage or useFetch) with real state updates; contrast vs componentDidMount. No Python.',
  async_await:
    'Async/Await (JS only): show real .then() chain AND async/await equivalent; template literals with backticks; Promise.all; try/catch. Note: async/await improves readability, not magical speed.',
  python_comprehensions:
    'List comprehensions: never claim always faster — say often more concise; nested + filter/transform examples; exact # Output comments; equivalent for-loop.',
  python_decorators:
    'Decorators: from functools import wraps, @wraps(func), *args/**kwargs; map wrapper transformation.',
  var_keyword:
    'var: define what var IS, why problematic, scope leak example with real output, then recommend let/const.',
};

const RESPONSE_MODE_PROMPTS = {
  [QUERY_TYPES.FACTUAL]:
    'TYPE 1 — FACTUAL: 1-2 lines max. Direct answer + optional ONE code line. ZERO repetition. No headings. No edge cases.',
  [QUERY_TYPES.CONCEPTUAL]:
    'TYPE 2 — CONCEPTUAL: Exactly 3 parts only — (1) one-line definition (2) one working example with real deterministic output comment (3) one key insight. No 8-step. No flashy headings. No edge cases.',
  [QUERY_TYPES.PROCEDURAL]:
    'TYPE 3 — PROCEDURAL: (1) one-line analogy only if natural, else skip (2) definition (3) Before vs After (4) working code (5) one insight + one edge case (6) 2-line summary. No full 8-step.',
  [QUERY_TYPES.DEEP]:
    'TYPE 4 — DEEP: Full structured answer with simple headings. Cover topic rules when applicable. Edge cases allowed. Still no buzzword headings or repetition.',
};

const USER_LEVEL_PROMPTS = {
  beginner: 'User level: beginner — plain language, minimal jargon, short sentences.',
  intermediate: 'User level: intermediate — balanced clarity and technical accuracy.',
  advanced: 'User level: advanced — concise, dense, no hand-holding.',
};

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
  explain: 'Explain editor code: validate syntax first, correct errors, then explain. Match response TYPE from classification.',
  fix: 'Fix user/editor code: validate first, state corrections, show fixed runnable code with deterministic output comments where applicable.',
  generate: 'Generate complete runnable code in the question domain only. No placeholders.',
  refactor: 'Refactor with Before vs After. Same language domain only.',
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
];

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

const PLACEHOLDER_PATTERNS = [
  /\/\/\s*code goes here/gi,
  /\/\/\s*your code here/gi,
  /\/\/\s*todo:?\s*implement/gi,
  /#\s*code goes here/gi,
  /\/\*\s*\.\.\.\s*\*\//g,
];

const FLASHY_HEADING_REPLACEMENTS = [
  [/under[- ]the[- ]hood/gi, 'How it works'],
  [/enterprise[- ]grade/gi, ''],
  [/enterprise real[- ]world/gi, 'Real example'],
  [/high[- ]impact analogy/gi, 'Analogy'],
  [/foundation code implementation/gi, 'Code'],
  [/production[- ]grade definition/gi, 'Definition'],
  [/internal mechanisms/gi, 'How it works'],
];

const ABSTRACT_OUTPUT_PATTERNS = [
  /\/\/\s*Output:\s*(A |An |The )?(simple|clean|basic|nice|component|button|form|ui|interface|counter app|example)\b[^\n]*/gi,
  /#\s*Output:\s*(A |An |The )?(simple|clean|basic|nice|component|button|form|ui|interface)\b[^\n]*/gi,
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

function isComparisonQuery(userMessage) {
  return COMPARE_SIGNALS.test((userMessage || '').toLowerCase());
}

/**
 * Layer 1 — 4-type query classifier with per-type confidence scores.
 */
export function classifyQuery(userMessage, command) {
  const msg = (userMessage || '').trim();
  const lower = msg.toLowerCase();
  const words = msg.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const compact = msg.replace(/\s/g, '');

  const scores = {
    [QUERY_TYPES.FACTUAL]: 0,
    [QUERY_TYPES.CONCEPTUAL]: 30,
    [QUERY_TYPES.PROCEDURAL]: 0,
    [QUERY_TYPES.DEEP]: 0,
  };

  if (command === 'fix' || command === 'refactor' || command === 'generate') {
    scores[QUERY_TYPES.PROCEDURAL] += 45;
  }
  if (command === 'explain') {
    scores[QUERY_TYPES.PROCEDURAL] += 35;
    scores[QUERY_TYPES.CONCEPTUAL] += 25;
  }
  if (isAboutUserCode(userMessage, command)) {
    scores[QUERY_TYPES.PROCEDURAL] += 25;
  }

  if (PURE_MATH_PATTERN.test(compact)) scores[QUERY_TYPES.FACTUAL] += 95;
  if (BINARY_VALIDATION_PATTERN.test(msg)) scores[QUERY_TYPES.FACTUAL] += 90;
  if (SINGLE_PRIMITIVE_PATTERN.test(msg)) scores[QUERY_TYPES.FACTUAL] += 88;
  if (SHORT_WHAT_IS_PATTERN.test(msg)) scores[QUERY_TYPES.FACTUAL] += 85;

  if (DEEP_SIGNALS.test(lower)) scores[QUERY_TYPES.DEEP] += 55;
  if (COMPARE_SIGNALS.test(lower)) scores[QUERY_TYPES.DEEP] += 50;
  if (/\bexplain\b/i.test(lower) && wordCount > 6) scores[QUERY_TYPES.DEEP] += 40;
  if (/\bexamples of\b/i.test(lower) && wordCount > 4) scores[QUERY_TYPES.DEEP] += 45;
  if (ARCHITECTURAL_TOPICS.test(lower) && (DEEP_SIGNALS.test(lower) || COMPARE_SIGNALS.test(lower))) {
    scores[QUERY_TYPES.DEEP] += 30;
  }

  if (PROCEDURAL_SIGNALS.test(lower)) scores[QUERY_TYPES.PROCEDURAL] += 80;
  if (/\bhow\b/i.test(lower) && wordCount <= 8 && !DEEP_SIGNALS.test(lower)) {
    scores[QUERY_TYPES.PROCEDURAL] += 35;
  }

  if (CONCEPTUAL_SIGNALS.test(lower) && scores[QUERY_TYPES.FACTUAL] < 70) {
    scores[QUERY_TYPES.CONCEPTUAL] += 65;
  }
  if (wordCount > 5 && scores[QUERY_TYPES.FACTUAL] < 50 && !PROCEDURAL_SIGNALS.test(lower)) {
    scores[QUERY_TYPES.CONCEPTUAL] += 20;
  }

  let type = QUERY_TYPES.CONCEPTUAL;
  let confidence = scores[QUERY_TYPES.CONCEPTUAL];

  Object.entries(scores).forEach(([t, score]) => {
    if (score > confidence) {
      confidence = score;
      type = t;
    }
  });

  confidence = Math.min(100, Math.max(0, confidence));

  if (confidence < 70) {
    type = QUERY_TYPES.CONCEPTUAL;
    confidence = 70;
  }

  return { type, confidence, scores };
}

/** Layer 1.6 — beginner / intermediate / advanced */
export function detectUserLevel(userMessage) {
  const lower = (userMessage || '').toLowerCase();

  if (/\b(beginner|new to|no experience|eli5|explain like i'?m five|simple terms|i'?m new)\b/i.test(lower)) {
    return 'beginner';
  }
  if (
    /\b(internals?|under the hood|memory model|event loop|amortized|vtable|compile[- ]time|big[- ]o)\b/i.test(
      lower
    ) ||
    /\b(production|scalability|distributed|architecture review)\b/i.test(lower)
  ) {
    return 'advanced';
  }
  return 'intermediate';
}

/** Layer 2 — domain for code isolation */
export function getQueryDomain(userMessage, editorLanguage) {
  if (isComparisonQuery(userMessage)) return 'comparison';

  const topic = extractMainTopic(userMessage, editorLanguage);
  if (topic && PYTHON_DOMAIN.has(topic)) return 'python';
  if (topic && JS_DOMAIN.has(topic)) return 'javascript';

  const lang = (editorLanguage || 'javascript').toLowerCase();
  if (PYTHON_DOMAIN.has(lang)) return 'python';
  if (JS_DOMAIN.has(lang)) return 'javascript';

  return 'neutral';
}

export function isLongFormQuery(userMessage, command) {
  const { type } = classifyQuery(userMessage, command);
  return type === QUERY_TYPES.PROCEDURAL || type === QUERY_TYPES.DEEP || Boolean(command);
}

export function isShortFormQuery(userMessage, command) {
  const { type } = classifyQuery(userMessage, command);
  return type === QUERY_TYPES.FACTUAL;
}

function isDetailedQuestion(userMessage, command) {
  const { type } = classifyQuery(userMessage, command);
  return type === QUERY_TYPES.PROCEDURAL || type === QUERY_TYPES.DEEP || Boolean(command);
}

function detectTopicCompletenessHints(userMessage, queryType) {
  const lower = (userMessage || '').toLowerCase();
  const hints = [];
  const needsDepth = queryType === QUERY_TYPES.PROCEDURAL || queryType === QUERY_TYPES.DEEP;

  if (
    needsDepth &&
    (/\b(hooks?|useState|useEffect|componentDidMount)\b/.test(lower) || /\breact\b.*\bhook/.test(lower))
  ) {
    hints.push(TOPIC_COMPLETENESS_RULES.react_hooks);
  }
  if (needsDepth && (/\basync\b/.test(lower) || /\bawait\b/.test(lower) || /\bpromise/i.test(lower))) {
    hints.push(TOPIC_COMPLETENESS_RULES.async_await);
  }
  if (
    needsDepth &&
    (/\blist comprehension\b/.test(lower) ||
      (/\bcomprehension\b/.test(lower) && /\bpython\b/.test(lower)))
  ) {
    hints.push(TOPIC_COMPLETENESS_RULES.python_comprehensions);
  }
  if (needsDepth && /\bdecorator/.test(lower) && /\bpython\b/.test(lower)) {
    hints.push(TOPIC_COMPLETENESS_RULES.python_decorators);
  }
  if (/\bvar\b/.test(lower) && (needsDepth || SHORT_WHAT_IS_PATTERN.test(userMessage))) {
    hints.push(TOPIC_COMPLETENESS_RULES.var_keyword);
  }

  return hints;
}

function detectQueryErrors(userMessage) {
  const msg = (userMessage || '').trim();
  if (!msg) return [];

  const corrections = [];

  if (/\bvar\b.*\b(?:best|recommended|modern|only)\b/i.test(msg) || /\bonly\s+var\b/i.test(msg)) {
    corrections.push('Correction: `var` is legacy — use `let` or `const`.');
  }
  if (/\bjquery\b.*\b(?:modern|recommended|best)\b/i.test(msg)) {
    corrections.push('Correction: jQuery is not recommended for new projects.');
  }
  if (/\bXMLHttpRequest\b.*\b(?:prefer|better|modern)\b/i.test(msg)) {
    corrections.push('Correction: prefer `fetch` over `XMLHttpRequest`.');
  }
  if (/\bpython\s+2\b/i.test(msg) && !/\bpython\s+3\b/i.test(msg)) {
    corrections.push('Correction: use Python 3 — Python 2 is end-of-life.');
  }
  if (/\bawait\b/.test(msg) && /\bnon-?blocking\s+thread\b/i.test(msg)) {
    corrections.push('Correction: `await` pauses the async function, not the whole thread.');
  }
  if (/\blist comprehension\b.*\balways faster\b/i.test(msg)) {
    corrections.push('Correction: comprehensions are often more concise; not always faster than loops.');
  }
  if (/\basync\b.*\b(?:faster|speed)\b/i.test(msg) && !/\breadability\b/i.test(msg)) {
    corrections.push('Correction: async/await mainly improves readability — it does not automatically make code faster.');
  }

  return corrections;
}

/** Layer 2.5 — validate user-provided editor code */
function validateEditorCode(code, language) {
  const issues = [];
  if (!code?.trim()) return issues;

  const openBrace = (code.match(/\{/g) || []).length;
  const closeBrace = (code.match(/\}/g) || []).length;
  const openParen = (code.match(/\(/g) || []).length;
  const closeParen = (code.match(/\)/g) || []).length;
  const openBracket = (code.match(/\[/g) || []).length;
  const closeBracket = (code.match(/\]/g) || []).length;

  if (openBrace !== closeBrace) issues.push('Unmatched `{` / `}` in user code — fix before explaining.');
  if (openParen !== closeParen) issues.push('Unmatched `(` / `)` in user code — fix before explaining.');
  if (openBracket !== closeBracket) issues.push('Unmatched `[` / `]` in user code — fix before explaining.');

  if ((language === 'javascript' || language === 'typescript') && /\$\{[^}]+\}/.test(code)) {
    const badTemplate = /'[^']*\$\{|"[^"]*\$\{/.test(code);
    if (badTemplate) {
      issues.push('Template expressions must use backticks, not single/double quotes.');
    }
  }

  return issues;
}

export function detectIntent(userMessage, command) {
  const msg = (userMessage || '').toLowerCase();
  if (command === 'fix' || /\b(debug|error|bug|fix|broken|crash|stack trace)\b/.test(msg)) {
    return 'debugging';
  }
  if (command === 'generate' || /\b(write|generate|create|implement|build|scaffold)\b/.test(msg)) {
    return 'coding';
  }
  if (COMPARE_SIGNALS.test(msg)) return 'decision-making';
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
  if (topicKey && TOPIC_SEARCH_QUERIES[topicKey]) return TOPIC_SEARCH_QUERIES[topicKey];
  return cleaned;
}

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

function buildRagContext(webResults, topicKey, lowSignal) {
  if (lowSignal) {
    return 'Web search returned low-signal results. Answer from verified internal knowledge only; note uncertainty briefly if needed.';
  }

  const lines = [];
  const official = topicKey && OFFICIAL_DOC_HINTS[topicKey];
  if (official) lines.push(`Official documentation: ${official}`);

  if (webResults?.length) {
    webResults.forEach((hit) => {
      lines.push(`${hit.title}: ${hit.snippet}`);
    });
  }

  return lines.length ? lines.join('\n') : '';
}

function buildUserContent({
  userMessage,
  command,
  code,
  filename,
  language,
  ragContext,
  classification,
  userLevel,
  domain,
}) {
  const parts = [];
  const { type, confidence } = classification;
  const includeEditor = shouldIncludeEditorCode(userMessage, command);

  const queryErrors = detectQueryErrors(userMessage);
  if (queryErrors.length) {
    parts.push(`Intercept and correct first (one line each):\n${queryErrors.join('\n')}`);
  }

  if (includeEditor && code?.trim()) {
    const codeIssues = validateEditorCode(code, language);
    if (codeIssues.length) {
      parts.push(`User code issues (fix before answering):\n${codeIssues.join('\n')}`);
    }
  }

  parts.push(
    `${RESPONSE_MODE_PROMPTS[type] || RESPONSE_MODE_PROMPTS[QUERY_TYPES.CONCEPTUAL]}\nClassification confidence: ${confidence}/100.`
  );
  parts.push(USER_LEVEL_PROMPTS[userLevel] || USER_LEVEL_PROMPTS.intermediate);

  if (domain === 'javascript') {
    parts.push('DOMAIN: JavaScript/JSX only in code blocks. Do not use Python syntax.');
  } else if (domain === 'python') {
    parts.push('DOMAIN: Python only in code blocks. Do not use JavaScript/JSX syntax.');
  } else if (domain === 'comparison') {
    parts.push('DOMAIN: Comparison — label Python vs JavaScript blocks clearly when both appear.');
  }

  const topicHints = detectTopicCompletenessHints(userMessage, type);
  if (topicHints.length) {
    parts.push(`Topic rules:\n${topicHints.join('\n')}`);
  }

  parts.push(`Intent: ${detectIntent(userMessage, command)}.`);

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
    parts.push('No editor code in context — answer the question only.');
  }

  if (ragContext?.trim() && (type === QUERY_TYPES.PROCEDURAL || type === QUERY_TYPES.DEEP)) {
    parts.push(`Web research (synthesize; no link dumps):\n${ragContext}`);
  }

  parts.push(`User question: ${userMessage}`);
  return parts.join('\n\n');
}

function cleanUserMessageForTopic(userMessage) {
  let msg = (userMessage || '').trim();
  if (COMMAND_LABELS.test(msg)) return '';
  return msg.replace(COMMAND_LABELS, '').trim();
}

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

export function dedupeCodeBlocksInText(text) {
  if (!text?.trim()) return '';

  const seenFingerprints = new Set();

  const cleaned = text.replace(/```([\w]*)\n?([\s\S]*?)```/g, (full, lang, code) => {
    const cleanCode = code.replace(/^\n|\n$/g, '').trim();
    if (!cleanCode) return '';

    const fp = codeFingerprint(cleanCode);
    if (seenFingerprints.has(fp)) return '';

    seenFingerprints.add(fp);
    return `\`\`\`${lang || 'code'}\n${cleanCode}\n\`\`\``;
  });

  return cleaned.replace(/\n{3,}/g, '\n\n').trim();
}

export function enforceLayoutIsolation(text) {
  if (!text?.trim()) return '';
  let output = text.replace(/\r\n/g, '\n');
  output = output.replace(/([^\n`])\s*```/g, '$1\n\n```');
  return output.replace(/\n{3,}/g, '\n\n').trim();
}

function looksLikePython(code) {
  return /^\s*def \w+\(|^\s*import \w+|^\s*from \w+ import/m.test(code);
}

function looksLikeJavaScript(code) {
  return (
    /\b(const|let|function|=>|useState|useEffect|export default|module\.exports)\b/.test(code) ||
    /<\w+[\s>]/.test(code)
  );
}

function enforceDomainIsolation(text, domain) {
  if (domain === 'comparison' || domain === 'neutral') return text;

  return text.replace(/```(\w*)\n([\s\S]*?)```/g, (full, lang, code) => {
    const tag = (lang || '').toLowerCase();
    const py = looksLikePython(code);
    const js = looksLikeJavaScript(code);

    if (domain === 'javascript' && py && !tag.includes('python')) return '';
    if (domain === 'python' && js && !tag.includes('javascript') && !tag.includes('js')) return '';

    const expectedLang = domain === 'python' ? 'python' : 'javascript';
    if (!tag || tag === 'code') {
      return `\`\`\`${expectedLang}\n${code.trim()}\n\`\`\``;
    }
    return full;
  });
}

function fixBrokenTemplateLiterals(code) {
  return code.replace(
    /(['"])([^'"]*\$\{[^}]+\}[^'"]*)\1/g,
    (_, _q, inner) => `\`${inner}\``
  );
}

function validateAndFixCodeBlocks(text) {
  return text.replace(/```(\w*)\n([\s\S]*?)```/g, (full, lang, code) => {
    let fixed = fixBrokenTemplateLiterals(code.trim());

    const open = (fixed.match(/[{([]/g) || []).length;
    const close = (fixed.match(/[})\]]/g) || []).length;
    if (Math.abs(open - close) > 2) {
      return '';
    }

    PLACEHOLDER_PATTERNS.forEach((p) => {
      fixed = fixed.replace(p, '');
    });

    return `\`\`\`${lang || 'code'}\n${fixed}\n\`\`\``;
  });
}

function removeAbstractOutputs(text) {
  let output = text;
  ABSTRACT_OUTPUT_PATTERNS.forEach((p) => {
    output = output.replace(p, '');
  });
  return output;
}

function simplifyFlashyHeadings(text) {
  let output = text;
  FLASHY_HEADING_REPLACEMENTS.forEach(([pattern, replacement]) => {
    output = output.replace(pattern, replacement);
  });
  return output.replace(/##\s+\s*/g, '## ').replace(/###\s+\s*/g, '### ');
}

function removeDuplicateSentences(text) {
  const prose = text.replace(/```[\s\S]*?```/g, (m) => m.replace(/\n/g, '\u0000'));
  const blocks = prose.split(/\n{2,}/);
  const seen = new Set();
  const kept = [];

  blocks.forEach((block) => {
    if (block.includes('```')) {
      kept.push(block.replace(/\u0000/g, '\n'));
      return;
    }

    const sentences = block.split(/(?<=[.!?])\s+/).filter(Boolean);
    const unique = [];

    sentences.forEach((s) => {
      const key = normalizeBlock(s);
      if (!key || key.length < 8) {
        unique.push(s);
        return;
      }
      if (seen.has(key)) return;
      seen.add(key);
      unique.push(s);
    });

    if (unique.length) kept.push(unique.join(' '));
  });

  return kept.join('\n\n');
}

function trimByQueryType(text, queryType) {
  if (queryType === QUERY_TYPES.FACTUAL) {
    return trimFactualResponse(text);
  }
  if (queryType === QUERY_TYPES.CONCEPTUAL) {
    return trimConceptualResponse(text);
  }
  return text;
}

function trimFactualResponse(text) {
  const lines = [];
  let codeBlock = null;
  let cursor = 0;

  while (cursor < text.length) {
    const openIdx = text.indexOf('```', cursor);
    if (openIdx === -1) {
      text
        .slice(cursor)
        .split('\n')
        .forEach((l) => {
          const t = l.trim();
          if (t) lines.push(t);
        });
      break;
    }
    text
      .slice(cursor, openIdx)
      .split('\n')
      .forEach((l) => {
        const t = l.trim();
        if (t) lines.push(t);
      });
    const closeIdx = text.indexOf('```', openIdx + 3);
    if (closeIdx === -1) {
      codeBlock = text.slice(openIdx);
      break;
    }
    if (!codeBlock) codeBlock = text.slice(openIdx, closeIdx + 3);
    cursor = closeIdx + 3;
  }

  const parts = [];
  if (lines.slice(0, 2).length) parts.push(lines.slice(0, 2).join('\n'));
  if (codeBlock) {
    if (parts.length) parts.push('');
    parts.push(codeBlock);
  }
  return parts.join('\n').trim() || text.trim();
}

function trimConceptualResponse(text) {
  const proseParas = splitParagraphs(text.replace(/```[\s\S]*?```/g, ''));
  const codeMatch = text.match(/```[\w]*\n[\s\S]*?```/);
  const parts = [];

  if (proseParas.slice(0, 3).length) {
    parts.push(proseParas.slice(0, 3).join('\n\n'));
  }
  if (codeMatch) {
    parts.push(codeMatch[0]);
  }

  return parts.join('\n\n').trim() || text.trim();
}

/** Layer 7 — self-correction pipeline */
export function postProcessResponse(text, options = {}) {
  if (!text?.trim()) return '';

  const { queryType = QUERY_TYPES.CONCEPTUAL, domain = 'neutral' } = options;
  const original = text;

  let output = enforceLayoutIsolation(text);

  FILLER_PATTERNS.forEach((pattern) => {
    output = output.replace(pattern, '');
  });

  output = removeAbstractOutputs(output);
  output = simplifyFlashyHeadings(output);
  output = removeDuplicateSentences(output);
  output = validateAndFixCodeBlocks(output);
  output = enforceDomainIsolation(output, domain);
  output = dedupeCodeBlocksInText(output);
  output = enforceLayoutIsolation(output);

  OUTDATED_TECH_NOTES.forEach(({ pattern, note }) => {
    if (pattern.test(original) && !output.includes(note)) {
      output = output.replace(pattern, (match) => `${match} ${note}`);
    }
  });

  MODERN_REPLACEMENTS.forEach(({ pattern, replacement }) => {
    output = output.replace(pattern, replacement);
  });

  output = trimByQueryType(output, queryType);
  output = enforceLayoutIsolation(output);

  return output.replace(/\n{3,}/g, '\n\n').trim();
}

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

function buildSuperResponse(geminiText, groqText, userMessage, command, classification, domain) {
  const sources = [geminiText, groqText].filter(Boolean);
  if (sources.length === 0) {
    throw new Error('No AI responses available. Check your API keys and try again.');
  }

  let merged = mergeResponses(geminiText, groqText);
  merged = postProcessResponse(merged, {
    queryType: classification.type,
    domain,
  });

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

  const classification = classifyQuery(payload.userMessage, payload.command);
  const userLevel = detectUserLevel(payload.userMessage);
  const domain = getQueryDomain(payload.userMessage, payload.language);
  const topicKey = extractMainTopic(payload.userMessage, payload.language);
  const needsSearch =
    classification.type === QUERY_TYPES.PROCEDURAL || classification.type === QUERY_TYPES.DEEP;

  const webResults = needsSearch
    ? await searchWeb(payload.userMessage, payload.language).catch(() => [])
    : [];

  const lowSignal = needsSearch && webResults.length === 0;
  const ragContext = needsSearch ? buildRagContext(webResults, topicKey, lowSignal) : '';

  const enrichedPayload = {
    ...payload,
    ragContext,
    classification,
    userLevel,
    domain,
  };

  const [geminiText, groqText] = await Promise.all([
    hasGemini ? sendViaGemini(enrichedPayload).catch(() => null) : Promise.resolve(null),
    hasGroq ? sendViaGroq(enrichedPayload).catch(() => null) : Promise.resolve(null),
  ]);

  const text = buildSuperResponse(
    geminiText,
    groqText,
    payload.userMessage,
    payload.command,
    classification,
    domain
  );

  return { text, queryType: classification.type, confidence: classification.confidence };
}

export {
  GEMINI_MODEL,
  GROQ_MODEL,
  COMMAND_INSTRUCTIONS,
  NEXUS_SYSTEM,
  MAX_OUTPUT_TOKENS,
};
