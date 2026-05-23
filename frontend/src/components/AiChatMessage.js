import React, { useEffect, useMemo } from 'react';

const COLORS = {
  h2: '#00BCD4',
  h3: '#9C27B0',
  bold: '#FFD700',
  text: '#E0E0E0',
  bullet: '#E0E0E0',
  codeBg: '#1a1a2e',
  codeText: '#00FF41',
  link: '#3b82f6',
};

const font = '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const codeFont = '"Courier New", Courier, monospace';

function stripSourceLabels(text) {
  return (text || '')
    .replace(/###\s*Gemini insights\s*/gi, '')
    .replace(/###\s*Groq insights\s*/gi, '')
    .replace(/\*\*Model sources:\*\*[^\n]*/gi, '')
    .replace(/Nexus AI Super Merge[^\n]*/gi, '')
    .replace(/Gemini Flash \+ Groq[^\n]*/gi, '')
    .trim();
}

function dedupeResponseText(text) {
  if (!text?.trim()) return '';
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const seen = new Set();
  const unique = [];

  paragraphs.forEach((para) => {
    const key = para
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/```[\s\S]*?```/g, '[code]')
      .trim();
    if (!key || seen.has(key)) return;
    seen.add(key);
    unique.push(para);
  });

  return unique.join('\n\n');
}

function parseContentBlocks(text) {
  const blocks = [];
  let cursor = 0;
  const src = text || '';

  while (cursor < src.length) {
    const openIdx = src.indexOf('```', cursor);

    if (openIdx === -1) {
      const tail = src.slice(cursor).trim();
      if (tail) blocks.push({ type: 'prose', content: tail });
      break;
    }

    const prose = src.slice(cursor, openIdx).trim();
    if (prose) blocks.push({ type: 'prose', content: prose });

    let langEnd = openIdx + 3;
    while (langEnd < src.length && src[langEnd] !== '\n' && src[langEnd] !== '\r') {
      langEnd += 1;
    }

    const lang = src.slice(openIdx + 3, langEnd).trim();
    const codeStart = langEnd < src.length && (src[langEnd] === '\n' || src[langEnd] === '\r') ? langEnd + 1 : langEnd;
    const closeIdx = src.indexOf('```', codeStart);

    if (closeIdx === -1) {
      const code = src.slice(codeStart).replace(/\n$/, '').trim();
      if (code) blocks.push({ type: 'code', lang: lang || 'code', code });
      break;
    }

    const code = src.slice(codeStart, closeIdx).replace(/\n$/, '').trim();
    blocks.push({ type: 'code', lang: lang || 'code', code });
    cursor = closeIdx + 3;
  }

  return blocks;
}

function renderInlineText(text) {
  const parts = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\[([^\]]+)\]\(([^)]+)\))/g;
  let last = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(
        <span key={`t-${last}`} style={{ color: COLORS.text }}>
          {text.slice(last, match.index)}
        </span>
      );
    }

    if (match[0].startsWith('**')) {
      parts.push(
        <strong key={`b-${match.index}`} style={{ color: COLORS.bold, fontWeight: 700 }}>
          {match[0].slice(2, -2)}
        </strong>
      );
    } else if (match[0].startsWith('`')) {
      parts.push(
        <code
          key={`c-${match.index}`}
          style={{
            padding: '2px 6px',
            borderRadius: '4px',
            fontFamily: codeFont,
            fontSize: '12px',
            color: COLORS.codeText,
            background: COLORS.codeBg,
          }}
        >
          {match[0].slice(1, -1)}
        </code>
      );
    } else {
      parts.push(
        <a
          key={`a-${match.index}`}
          href={match[3]}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: COLORS.link, textDecoration: 'underline' }}
        >
          {match[2]}
        </a>
      );
    }

    last = match.index + match[0].length;
  }

  if (last < text.length) {
    parts.push(
      <span key={`t-${last}`} style={{ color: COLORS.text }}>
        {text.slice(last)}
      </span>
    );
  }

  return parts.length > 0 ? parts : <span style={{ color: COLORS.text }}>{text}</span>;
}

function CodeBlock({ code, lang, label }) {
  const displayLang = lang && lang !== 'code' ? lang : 'code';

  return (
    <div
      style={{
        margin: '16px 0',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        display: 'block',
      }}
    >
      <div
        style={{
          display: 'block',
          padding: '6px 0',
          fontSize: '12px',
          fontWeight: 600,
          color: COLORS.text,
          fontFamily: font,
          marginBottom: '4px',
        }}
      >
        {label || `💻 ${displayLang}`}
      </div>
      <pre
        style={{
          display: 'block',
          margin: 0,
          padding: '12px',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          overflowX: 'auto',
          whiteSpace: 'pre',
          wordBreak: 'normal',
          fontSize: '12px',
          lineHeight: 1.5,
          fontFamily: codeFont,
          color: COLORS.codeText,
          background: COLORS.codeBg,
          borderRadius: '8px',
          border: '1px solid rgba(0, 255, 65, 0.2)',
        }}
      >
        <code style={{ fontFamily: 'inherit', color: 'inherit', background: 'transparent' }}>{code}</code>
      </pre>
    </div>
  );
}

/** Split inline numbered lists onto separate lines: "1. a 2. b" → two lines */
function expandNumberedLines(content) {
  const expanded = [];

  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    const parts = trimmed.split(/(?=\d+\.\s+)/).map((p) => p.trim()).filter(Boolean);
    if (parts.length > 1 && parts.every((p) => /^\d+\.\s/.test(p))) {
      parts.forEach((p) => expanded.push(p));
    } else {
      expanded.push(trimmed);
    }
  });

  return expanded;
}

function ProseBlock({ content }) {
  const lines = expandNumberedLines(content);
  const elements = [];
  let bulletItems = [];

  const flushBullets = () => {
    if (bulletItems.length === 0) return;
    elements.push(
      <ul
        key={`ul-${elements.length}`}
        style={{
          margin: '0 0 12px 0',
          paddingLeft: '20px',
          listStyleType: 'disc',
        }}
      >
        {bulletItems.map((item, i) => (
          <li
            key={i}
            style={{
              display: 'block',
              marginBottom: '8px',
              lineHeight: 1.55,
              color: COLORS.bullet,
            }}
          >
            {renderInlineText(item)}
          </li>
        ))}
      </ul>
    );
    bulletItems = [];
  };

  lines.forEach((rawLine) => {
    const trimmed = rawLine.trim();
    if (!trimmed) return;

    if (/^###\s+/.test(trimmed)) {
      flushBullets();
      const h3Text = trimmed.replace(/^###\s+/, '');
      const isExampleLabel = /^Example\s+\d+/i.test(h3Text);
      elements.push(
        <h3
          key={`h3-${elements.length}`}
          style={{
            display: 'block',
            width: '100%',
            margin: isExampleLabel ? '16px 0 6px 0' : '12px 0 8px 0',
            fontSize: '14px',
            fontWeight: 600,
            color: isExampleLabel ? COLORS.text : COLORS.h3,
            fontFamily: font,
            lineHeight: 1.35,
          }}
        >
          {isExampleLabel ? `💻 ${h3Text}` : h3Text}
        </h3>
      );
      return;
    }

    if (/^##\s+/.test(trimmed)) {
      flushBullets();
      elements.push(
        <h2
          key={`h2-${elements.length}`}
          style={{
            display: 'block',
            width: '100%',
            margin: '16px 0 8px 0',
            fontSize: '15px',
            fontWeight: 700,
            color: COLORS.h2,
            fontFamily: font,
            lineHeight: 1.35,
          }}
        >
          {trimmed.replace(/^##\s+/, '')}
        </h2>
      );
      return;
    }

    if (/^[-*•]\s+/.test(trimmed)) {
      bulletItems.push(trimmed.replace(/^[-*•]\s+/, ''));
      return;
    }

    if (/^\d+\.\s/.test(trimmed)) {
      flushBullets();
      elements.push(
        <p
          key={`ol-${elements.length}`}
          style={{
            display: 'block',
            width: '100%',
            margin: '0 0 8px 0',
            paddingLeft: '4px',
            lineHeight: 1.55,
            color: COLORS.text,
          }}
        >
          {renderInlineText(trimmed)}
        </p>
      );
      return;
    }

    flushBullets();
    elements.push(
      <p
        key={`p-${elements.length}`}
        style={{
          display: 'block',
          width: '100%',
          margin: '0 0 12px 0',
          lineHeight: 1.6,
          color: COLORS.text,
        }}
      >
        {renderInlineText(trimmed)}
      </p>
    );
  });

  flushBullets();
  return <>{elements}</>;
}

function ensureLeadingHeading(text) {
  const trimmed = (text || '').trim();
  if (!trimmed) return '## Nexus AI Response';
  const firstLine = trimmed.split('\n').find((l) => l.trim())?.trim() || '';
  if (/^##\s+/.test(firstLine)) return trimmed;
  return `## Nexus AI Response\n\n${trimmed}`;
}

export function AiFormattedMessage({ text }) {
  const displayText = useMemo(
    () => ensureLeadingHeading(dedupeResponseText(stripSourceLabels(text))),
    [text]
  );
  const blocks = useMemo(() => parseContentBlocks(displayText), [displayText]);

  useEffect(() => {
    console.log('[Nexus AI] AiFormattedMessage parsed', {
      blockCount: blocks.length,
      colors: {
        paragraph: COLORS.text,
        headingH2: COLORS.h2,
        headingH3: COLORS.h3,
        bold: COLORS.bold,
      },
      blocks: blocks.map((b, i) => ({
        i,
        type: b.type,
        firstLine: b.type === 'prose' ? b.content.split('\n').find((l) => l.trim()) : `code:${b.lang}`,
      })),
    });
  }, [displayText, blocks]);

  if (blocks.length === 0) {
    return (
      <div style={{ color: COLORS.text, fontFamily: font, fontSize: '13px' }}>
        <h2 style={{ display: 'block', margin: '16px 0 8px', fontSize: '15px', fontWeight: 700, color: COLORS.h2 }}>
          Nexus AI Response
        </h2>
        <p style={{ margin: '0 0 12px', color: COLORS.text }}>{stripSourceLabels(text)}</p>
      </div>
    );
  }

  return (
    <div
      style={{
        fontFamily: font,
        fontSize: '13px',
        color: COLORS.text,
        width: '100%',
        maxWidth: '100%',
      }}
    >
      {blocks.map((block, idx) =>
        block.type === 'code' ? (
          <CodeBlock
            key={`code-${idx}`}
            code={block.code}
            lang={block.lang}
            label={`💻 ${block.lang && block.lang !== 'code' ? block.lang : 'code'}`}
          />
        ) : (
          <div key={`prose-${idx}`} style={{ display: 'block', width: '100%' }}>
            <ProseBlock content={block.content} />
          </div>
        )
      )}
    </div>
  );
}

export function ChatBubble({ role, children, error, animate, animationDelay = 0 }) {
  const isUser = role === 'user';

  return (
    <div
      className={animate ? 'nx-chat-fade-in' : undefined}
      style={{
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        maxWidth: isUser ? '88%' : '96%',
        width: isUser ? 'auto' : '100%',
        padding: isUser ? '10px 14px' : '14px 16px',
        borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
        fontSize: '13px',
        lineHeight: 1.55,
        wordBreak: 'break-word',
        animationDelay: animate ? `${animationDelay}s` : undefined,
        color: error ? '#fca5a5' : isUser ? '#f4f4f5' : COLORS.text,
        background: isUser
          ? 'linear-gradient(135deg, rgba(0, 188, 212, 0.35) 0%, rgba(156, 39, 176, 0.28) 100%)'
          : error
            ? 'rgba(127, 29, 29, 0.4)'
            : 'linear-gradient(180deg, rgba(18, 18, 28, 0.98) 0%, rgba(12, 12, 20, 0.98) 100%)',
        border: `1px solid ${
          isUser
            ? 'rgba(0, 188, 212, 0.35)'
            : error
              ? 'rgba(239, 68, 68, 0.4)'
              : 'rgba(0, 188, 212, 0.12)'
        }`,
        boxShadow: isUser
          ? '0 4px 20px rgba(0, 188, 212, 0.15)'
          : '0 4px 24px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      {!isUser && !error && (
        <div
          style={{
            fontSize: '11px',
            fontWeight: 700,
            marginBottom: '10px',
            letterSpacing: '0.04em',
            color: COLORS.text,
          }}
        >
          Nexus AI
        </div>
      )}
      <div style={{ width: '100%', maxWidth: '100%' }}>{children}</div>
    </div>
  );
}
