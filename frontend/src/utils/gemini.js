import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_MODEL = 'gemini-2.0-flash';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const MAX_OUTPUT_TOKENS = 8192;
const TEMPERATURE = 0.9;

const NEXUS_SYSTEM = `You are Nexus AI, the world's most advanced coding assistant. You MUST always give:
- Extremely detailed and complete answers
- Minimum 500 words per response
- Full history and background of the topic
- Multiple real-world examples (minimum 3)
- Complete working code examples
- Best practices and pro tips
- Common mistakes to avoid
- Real world use cases
- Performance tips
- Future of the technology
- Comparison with alternatives
- Step by step explanations
- Never give short answers
- Never cut responses short
- Always complete every section fully`;

const RESPONSE_SECTIONS = [
  '## 🚀 Introduction',
  '## 📚 Full Background & History',
  '## 💡 Core Concepts (detailed)',
  '## 💻 Code Examples (minimum 3 examples)',
  '## 🔥 Advanced Features',
  '## ⚠️ Common Mistakes',
  '## ✅ Best Practices',
  '## 🌍 Real World Use Cases',
  '## 📊 Comparison with Alternatives',
  '## 🎯 Tips & Tricks',
  '## 📝 Summary',
  '## 🔗 References',
];

const STRUCTURE_PROMPT = `Format your entire answer using these markdown sections when applicable (write each one fully, never leave empty placeholders):
${RESPONSE_SECTIONS.join('\n')}`;

const COMMAND_INSTRUCTIONS = {
  explain:
    'Explain the editor code in maximum depth across every required section. Minimum 500 words. Include 3+ code examples.',
  fix:
    'Diagnose every bug in depth, show full corrected code, mistakes, best practices, and comparisons. Minimum 500 words.',
  generate:
    'Generate complete production-ready code with 3+ examples, use cases, performance tips, and alternatives. Minimum 500 words.',
  refactor:
    'Deliver a comprehensive refactor guide with before/after code, advanced patterns, and real-world context. Minimum 500 words.',
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
  'explain', 'fix', 'generate', 'refactor', 'bug', 'file', 'example', 'examples', 'minimum',
  'insights', 'untitled', 'active', 'message', 'user', 'task', 'editor',
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

const SECTION_PATTERNS = {
  '## 🚀 Introduction': [/introduction/, /\bintro\b/, /overview/],
  '## 📚 Full Background & History': [/background/, /history/],
  '## 💡 Core Concepts (detailed)': [/core concept/, /\bconcepts\b/, /fundamental/],
  '## 💻 Code Examples (minimum 3 examples)': [/code example/, /\bsnippets\b/],
  '## 🔥 Advanced Features': [/advanced/],
  '## ⚠️ Common Mistakes': [/mistake/, /pitfall/],
  '## ✅ Best Practices': [/best practice/],
  '## 🌍 Real World Use Cases': [/real world/, /use case/],
  '## 📊 Comparison with Alternatives': [/comparison/, /alternative/, /versus/],
  '## 🎯 Tips & Tricks': [/tip/, /trick/],
  '## 📝 Summary': [/summary/, /conclusion/],
};

function getGeminiKey() {
  return process.env.REACT_APP_GEMINI_API_KEY?.trim() || '';
}

function getGroqKey() {
  return process.env.REACT_APP_GROQ_API_KEY?.trim() || '';
}

function buildUserContent({ userMessage, command, code, filename, language }) {
  const parts = [STRUCTURE_PROMPT];

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

  parts.push(`User message: ${userMessage}`);
  return parts.join('\n\n');
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
    if (words.length >= 2) {
      queries.push(words.slice(0, 3).join(' '));
    }
  }

  if (queries.length === 0) {
    queries.push(language && LANG_WIKI_QUERY[language] ? LANG_WIKI_QUERY[language] : 'Computer programming');
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
          content: `${NEXUS_SYSTEM}\n\n${STRUCTURE_PROMPT}${commandHint ? `\n\nTask: ${commandHint}` : ''}`,
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

function isExactDuplicateBlock(a, b) {
  return normalizeBlock(a) === normalizeBlock(b);
}

function isDuplicateSection(a, b) {
  const na = normalizeBlock(a);
  const nb = normalizeBlock(b);
  if (!na || !nb) return true;
  if (na === nb) return true;
  if (na.length > 120 && nb.length > 120 && (na.includes(nb) || nb.includes(na))) return true;
  return wordOverlapRatio(a, b) > 0.82;
}

function stripCodeFromText(text) {
  return (text || '').replace(/```[\s\S]*?```/g, '').trim();
}

function extractCodeBlocks(text) {
  const blocks = [];
  const regex = /```([\w]*)\n?([\s\S]*?)```/g;
  let match;
  while ((match = regex.exec(text || '')) !== null) {
    const lang = match[1] || 'code';
    const code = match[2].replace(/^\n|\n$/g, '').trim();
    if (code) {
      blocks.push({ lang, code, raw: `\`\`\`${lang}\n${code}\n\`\`\`` });
    }
  }
  return blocks;
}

function extractAllCodeBlocks(sources) {
  const all = [];
  sources.forEach((text) => {
    extractCodeBlocks(text).forEach((block) => {
      if (!all.some((existing) => isExactDuplicateBlock(existing.code, block.code))) {
        all.push(block);
      }
    });
  });
  return all;
}

function formatCodeBlocksForOutput(blocks) {
  if (blocks.length === 0) return '';

  return blocks
    .map((block, i) => {
      const lang = block.lang || 'code';
      return `### Example ${i + 1}\n\n\`\`\`${lang}\n${block.code}\n\`\`\``;
    })
    .join('\n\n');
}

function parseSectionsFromMarkdown(text) {
  const map = new Map();
  if (!text?.trim()) return map;

  const parts = text.split(/(?=^##\s+)/m);
  parts.forEach((part) => {
    const trimmed = part.trim();
    if (!trimmed) return;
    const match = trimmed.match(/^##\s+(.+?)(?:\n+([\s\S]*))?$/);
    if (!match) return;

    const heading = `## ${match[1].trim()}`;
    const body = stripCodeFromText(match[2] || '').trim();
    if (!body || body.length < 30) return;

    const existing = map.get(heading) || [];
    if (!existing.some((e) => isDuplicateSection(e, body))) {
      existing.push(body);
    }
    map.set(heading, existing);
  });

  return map;
}

function matchCanonicalSection(heading) {
  const h = heading.toLowerCase();
  for (const [canonical, patterns] of Object.entries(SECTION_PATTERNS)) {
    if (patterns.some((re) => re.test(h))) return canonical;
  }
  return null;
}

/**
 * Merge Gemini + Groq: if nearly identical, keep one; else merge unique sections only once.
 */
export function mergeResponses(geminiText, groqText) {
  const g = geminiText?.trim() || '';
  const q = groqText?.trim() || '';

  if (!g) return q;
  if (!q) return g;

  const proseG = normalizeBlock(stripCodeFromText(g));
  const proseQ = normalizeBlock(stripCodeFromText(q));

  if (proseG === proseQ || (proseG.length > 150 && proseQ.length > 150 && wordOverlapRatio(g, q) > 0.78)) {
    return g.length >= q.length ? g : q;
  }

  const mergedByCanonical = new Map();

  [g, q].forEach((source) => {
    parseSectionsFromMarkdown(source).forEach((bodies, heading) => {
      const canonical = matchCanonicalSection(heading) || heading;
      const existing = mergedByCanonical.get(canonical) || [];

      bodies.forEach((body) => {
        if (!existing.some((e) => isDuplicateSection(e, body))) {
          existing.push(body);
        }
      });

      mergedByCanonical.set(canonical, existing);
    });
  });

  if (mergedByCanonical.size === 0) {
    return g.length >= q.length ? g : q;
  }

  const parts = [];
  RESPONSE_SECTIONS.forEach((canonical) => {
    if (canonical === '## 🔗 References') return;
    const bodies = mergedByCanonical.get(canonical);
    if (!bodies?.length) return;
    parts.push(canonical, '', bodies.join('\n\n'), '');
  });

  const used = new Set(RESPONSE_SECTIONS);
  mergedByCanonical.forEach((bodies, key) => {
    if (used.has(key) || !bodies.length) return;
    parts.push(key, '', bodies.join('\n\n'), '');
  });

  return parts.join('\n').trim() || (g.length >= q.length ? g : q);
}

function hasRealContent(body) {
  const t = (body || '').trim();
  if (!t || t.length < 50) return false;
  if (/^_See combined/i.test(t)) return false;
  if (/^See combined analysis/i.test(t)) return false;
  return true;
}

function findBodyForSection(sectionMap, canonical, codeBlocksFormatted) {
  if (canonical === '## 💻 Code Examples (minimum 3 examples)') {
    return codeBlocksFormatted;
  }

  const patterns = SECTION_PATTERNS[canonical];
  if (!patterns) return '';

  let content = '';
  sectionMap.forEach((bodies, heading) => {
    const h = heading.toLowerCase();
    if (patterns.some((re) => re.test(h))) {
      content = [content, ...bodies].filter(Boolean).join('\n\n');
    }
  });

  if (content) return content;

  const direct = sectionMap.get(canonical);
  if (direct?.length) return direct.join('\n\n');

  return '';
}

function buildSuperResponse(geminiText, groqText, wikiArticles) {
  const sources = [geminiText, groqText].filter(Boolean);
  if (sources.length === 0) {
    throw new Error('No AI responses available. Check your API keys and try again.');
  }

  const mergedNarrative = mergeResponses(geminiText, groqText);
  const allCodeBlocks = extractAllCodeBlocks(sources);
  const codeBlocksFormatted = formatCodeBlocksForOutput(allCodeBlocks);
  const sectionMap = parseSectionsFromMarkdown(mergedNarrative);

  const output = [];

  RESPONSE_SECTIONS.forEach((heading) => {
    if (heading === '## 🔗 References') return;

    let body = findBodyForSection(sectionMap, heading, codeBlocksFormatted);
    if (!hasRealContent(body)) return;

    output.push(heading, '', body.trim(), '');
  });

  if (wikiArticles.length > 0) {
    const refBody = wikiArticles
      .map(
        (article, i) =>
          `${i + 1}. **${article.title}**\n\n${article.excerpt}\n\n[Read on Wikipedia](${article.url})`
      )
      .join('\n\n');

    if (hasRealContent(refBody)) {
      output.push('## 🔗 References', '', refBody, '');
    }
  }

  if (output.length === 0) {
    const fallback = [mergedNarrative, codeBlocksFormatted].filter(Boolean).join('\n\n');
    return fallback || 'No response generated.';
  }

  return output.join('\n').replace(/\n{3,}/g, '\n\n').trim();
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

  const [geminiText, groqText, wikiArticles] = await Promise.all([
    hasGemini ? sendViaGemini(payload).catch(() => null) : Promise.resolve(null),
    hasGroq ? sendViaGroq(payload).catch(() => null) : Promise.resolve(null),
    fetchWikipediaArticles(payload.userMessage, payload.language).catch(() => []),
  ]);

  const text = buildSuperResponse(geminiText, groqText, wikiArticles || []);
  return { text };
}

export {
  GEMINI_MODEL,
  GROQ_MODEL,
  COMMAND_INSTRUCTIONS,
  NEXUS_SYSTEM,
  RESPONSE_SECTIONS,
  MAX_OUTPUT_TOKENS,
};
