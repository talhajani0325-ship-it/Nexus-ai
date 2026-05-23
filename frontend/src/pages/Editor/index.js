import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import MonacoEditor from '@monaco-editor/react';
import { sendMessage } from '../../utils/gemini';
import { AiFormattedMessage, ChatBubble } from '../../components/AiChatMessage';

const C = {
  bg: '#0a0a0f',
  bgPanel: '#0d0d14',
  bgCard: 'rgba(18, 18, 28, 0.9)',
  bgElevated: '#12121c',
  border: 'rgba(255, 255, 255, 0.08)',
  text: '#f4f4f5',
  textMuted: '#a1a1aa',
  textDim: '#71717a',
  cyan: '#22d3ee',
  violet: '#a78bfa',
  green: '#22c55e',
};

const font = '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const mono = '"Fira Code", "Consolas", monospace';

const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'python', label: 'Python' },
  { id: 'html', label: 'HTML' },
  { id: 'css', label: 'CSS' },
  { id: 'json', label: 'JSON' },
  { id: 'markdown', label: 'Markdown' },
];

const INITIAL_TREE = [
  {
    id: 'root-src',
    name: 'src',
    type: 'folder',
    children: [
      { id: 'file-index', name: 'index.js', type: 'file' },
      { id: 'file-app', name: 'App.js', type: 'file' },
      { id: 'file-styles', name: 'styles.css', type: 'file' },
    ],
  },
  {
    id: 'root-components',
    name: 'components',
    type: 'folder',
    children: [{ id: 'file-header', name: 'Header.jsx', type: 'file' }],
  },
  {
    id: 'file-package',
    name: 'package.json',
    type: 'file',
  },
  { id: 'file-readme', name: 'README.md', type: 'file' },
];

const AI_COMMANDS = [
  { id: 'explain', label: 'Explain this code' },
  { id: 'fix', label: 'Fix this bug' },
  { id: 'generate', label: 'Generate code' },
  { id: 'refactor', label: 'Refactor code' },
];

const INITIAL_CONTENTS = {
  'file-index': `import { createApp } from './App.js';\n\ncreateApp({\n  plugins: [aiAssist()],\n});\n`,
  'file-app': `export function createApp(config) {\n  return {\n    async launch() {\n      console.log('Nexus AI ready');\n    },\n  };\n}\n`,
  'file-styles': `body {\n  background: #0a0a0f;\n  color: #f4f4f5;\n}\n`,
  'file-header': `export function Header() {\n  return <header>Nexus AI</header>;\n}\n`,
  'file-package': `{\n  "name": "nexus-project",\n  "version": "1.0.0"\n}\n`,
  'file-readme': `# Nexus AI Project\n\nBuilt with Nexus AI Code Editor.\n`,
};

function langFromFilename(name) {
  if (!name) return 'javascript';
  const ext = name.split('.').pop()?.toLowerCase();
  const map = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    html: 'html',
    css: 'css',
    json: 'json',
    md: 'markdown',
  };
  return map[ext] || 'javascript';
}

function FileIcon({ name, type, size = 16 }) {
  const ext = type === 'folder' ? 'folder' : name?.split('.').pop()?.toLowerCase();
  const colors = {
    folder: C.cyan,
    js: '#fbbf24',
    jsx: '#60a5fa',
    ts: '#3b82f6',
    tsx: '#60a5fa',
    py: '#34d399',
    css: '#a78bfa',
    html: '#f97316',
    json: '#94a3b8',
    md: '#22d3ee',
  };
  const color = colors[ext] || C.textMuted;

  if (type === 'folder') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
        <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" opacity="0.9" />
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

function FileTreeNode({ node, depth, activeFileId, expandedFolders, onToggleFolder, onSelectFile }) {
  const isFolder = node.type === 'folder';
  const isExpanded = expandedFolders.has(node.id);
  const isActive = !isFolder && activeFileId === node.id;

  return (
    <div>
      <button
        type="button"
        onClick={() => (isFolder ? onToggleFolder(node.id) : onSelectFile(node))}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          width: '100%',
          padding: `6px 10px 6px ${10 + depth * 14}px`,
          fontSize: '13px',
          fontFamily: font,
          color: isActive ? C.cyan : C.textMuted,
          background: isActive ? 'rgba(34, 211, 238, 0.1)' : 'transparent',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        {isFolder && (
          <span style={{ fontSize: '10px', color: C.textDim, width: '12px' }}>{isExpanded ? '▼' : '▶'}</span>
        )}
        {!isFolder && <span style={{ width: '12px' }} />}
        <FileIcon name={node.name} type={node.type} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{node.name}</span>
      </button>
      {isFolder && isExpanded && node.children?.map((child) => (
        <FileTreeNode
          key={child.id}
          node={child}
          depth={depth + 1}
          activeFileId={activeFileId}
          expandedFolders={expandedFolders}
          onToggleFolder={onToggleFolder}
          onSelectFile={onSelectFile}
        />
      ))}
    </div>
  );
}

function EditorPage() {
  const [fileTree, setFileTree] = useState(INITIAL_TREE);
  const [fileContents, setFileContents] = useState(INITIAL_CONTENTS);
  const [activeFile, setActiveFile] = useState({ id: 'file-index', name: 'index.js' });
  const [language, setLanguage] = useState('javascript');
  const [expandedFolders, setExpandedFolders] = useState(new Set(['root-src', 'root-components']));
  const [terminalOpen, setTerminalOpen] = useState(true);
  const [terminalLines, setTerminalLines] = useState([
    '> Nexus AI Terminal v1.0',
    '> Ready. Click Run to execute your code.',
  ]);
  const [aiMessages, setAiMessages] = useState([
    { role: 'ai', text: 'Hello! I am Nexus AI. Ask me to explain, refactor, or generate code — or use the quick commands below.' },
  ]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const chatScrollRef = useRef(null);
  const chatEndRef = useRef(null);

  const editorValue = fileContents[activeFile.id] ?? '';

  useEffect(() => {
    const scrollToBottom = () => {
      if (chatEndRef.current) {
        chatEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      } else if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
      }
    };
    const id = requestAnimationFrame(scrollToBottom);
    return () => cancelAnimationFrame(id);
  }, [aiMessages, aiLoading]);

  const setEditorValue = useCallback(
    (value) => {
      setFileContents((prev) => ({ ...prev, [activeFile.id]: value ?? '' }));
    },
    [activeFile.id]
  );

  const appendTerminal = (line) => {
    setTerminalLines((prev) => [...prev, line]);
    setTerminalOpen(true);
  };

  const handleSelectFile = (file) => {
    setActiveFile({ id: file.id, name: file.name });
    setLanguage(langFromFilename(file.name));
  };

  const handleToggleFolder = (folderId) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  const addTreeNode = (parentId, type) => {
    const name = window.prompt(type === 'folder' ? 'Folder name:' : 'File name:');
    if (!name?.trim()) return;

    const newId = `file-${Date.now()}`;
    const newNode = type === 'folder' ? { id: newId, name: name.trim(), type: 'folder', children: [] } : { id: newId, name: name.trim(), type: 'file' };

    if (type === 'file') {
      setFileContents((prev) => ({ ...prev, [newId]: '' }));
    }

    const insert = (nodes) =>
      nodes.map((n) => {
        if (n.id === parentId && n.type === 'folder') {
          return { ...n, children: [...(n.children || []), newNode] };
        }
        if (n.children) return { ...n, children: insert(n.children) };
        return n;
      });

    if (parentId === 'root') {
      setFileTree((prev) => [...prev, newNode]);
    } else {
      setFileTree((prev) => insert(prev));
      setExpandedFolders((prev) => new Set([...prev, parentId]));
    }

    if (type === 'file') {
      setActiveFile({ id: newId, name: name.trim() });
      setLanguage(langFromFilename(name.trim()));
    }
  };

  const handleRun = () => {
    appendTerminal(`> Running ${activeFile.name}...`);
    appendTerminal('✓ Build completed successfully (0.42s)');
    appendTerminal('✓ No errors found');
  };

  const handleSave = () => {
    appendTerminal(`> Saved ${activeFile.name}`);
  };

  const runAiChat = useCallback(
    async (text, command = null) => {
      const userText = text.trim();
      if (!userText || aiLoading) return;

      setAiMessages((prev) => [...prev, { role: 'user', text: userText }]);
      setAiInput('');
      setAiLoading(true);

      try {
        const { text: reply } = await sendMessage({
          userMessage: userText,
          command,
          code: editorValue,
          filename: activeFile.name,
          language,
        });

        setAiMessages((prev) => [...prev, { role: 'ai', text: reply }]);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Something went wrong.';
        setAiMessages((prev) => [
          ...prev,
          { role: 'ai', text: `Sorry, I could not respond: ${message}`, error: true },
        ]);
      } finally {
        setAiLoading(false);
      }
    },
    [aiLoading, editorValue, activeFile.name, language]
  );

  const handleAiSend = (e) => {
    e.preventDefault();
    runAiChat(aiInput);
  };

  const handleAiCommand = (commandId) => {
    const cmd = AI_COMMANDS.find((c) => c.id === commandId);
    if (!cmd) return;
    runAiChat(cmd.label, commandId);
  };

  const toolbarBtn = (variant) => ({
    padding: '8px 14px',
    fontSize: '13px',
    fontWeight: 600,
    fontFamily: font,
    borderRadius: '8px',
    border: `1px solid ${C.border}`,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    ...(variant === 'run'
      ? {
          background: 'linear-gradient(135deg, #16a34a, #22c55e)',
          color: '#fff',
          border: '1px solid rgba(34, 197, 94, 0.4)',
          boxShadow: '0 0 16px rgba(34, 197, 94, 0.25)',
        }
      : variant === 'save'
        ? { background: 'rgba(18, 18, 28, 0.9)', color: C.text }
        : { background: 'rgba(18, 18, 28, 0.9)', color: C.textMuted }),
  });

  const editorHeight = useMemo(() => (terminalOpen ? 'calc(100% - 180px)' : '100%'), [terminalOpen]);

  return (
    <>
      <style>{`
        .nx-ed-select:focus { border-color: rgba(34, 211, 238, 0.5) !important; outline: none; }
        .nx-ed-ai-input:focus { border-color: rgba(34, 211, 238, 0.5) !important; box-shadow: 0 0 0 2px rgba(34, 211, 238, 0.1); outline: none; }
        .nx-ed-icon-btn:hover { background: rgba(255,255,255,0.06) !important; }
        @keyframes nx-spin { to { transform: rotate(360deg); } }
        @keyframes nx-chat-fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .nx-chat-fade-in {
          opacity: 0;
          animation: nx-chat-fade-in 0.4s ease-out forwards;
        }
      `}</style>

      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: C.bg, color: C.text, fontFamily: font, overflow: 'hidden' }}>
        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          {/* File explorer */}
          <aside
            style={{
              width: '240px',
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              background: C.bgPanel,
              borderRight: `1px solid ${C.border}`,
            }}
          >
            <div style={{ padding: '12px 14px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', color: C.textDim, textTransform: 'uppercase' }}>Explorer</span>
              <Link to="/dashboard" style={{ fontSize: '12px', color: C.cyan, textDecoration: 'none' }}>← Dashboard</Link>
            </div>
            <div style={{ padding: '8px', display: 'flex', gap: '6px', borderBottom: `1px solid ${C.border}` }}>
              <button type="button" className="nx-ed-icon-btn" onClick={() => addTreeNode('root', 'file')} style={{ flex: 1, ...toolbarBtn('save'), fontSize: '12px', justifyContent: 'center' }} title="New file">
                + File
              </button>
              <button type="button" className="nx-ed-icon-btn" onClick={() => addTreeNode('root-src', 'folder')} style={{ flex: 1, ...toolbarBtn('save'), fontSize: '12px', justifyContent: 'center' }} title="New folder">
                + Folder
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 4px' }}>
              {fileTree.map((node) => (
                <FileTreeNode
                  key={node.id}
                  node={node}
                  depth={0}
                  activeFileId={activeFile.id}
                  expandedFolders={expandedFolders}
                  onToggleFolder={handleToggleFolder}
                  onSelectFile={handleSelectFile}
                />
              ))}
            </div>
          </aside>

          {/* Center + AI */}
          <div style={{ flex: 1, display: 'flex', minWidth: 0 }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              {/* Toolbar */}
              <div
                style={{
                  height: '48px',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '0 16px',
                  borderBottom: `1px solid ${C.border}`,
                  background: C.bgElevated,
                }}
              >
                <div
                  style={{
                    padding: '6px 14px',
                    fontSize: '13px',
                    fontWeight: 500,
                    fontFamily: mono,
                    color: C.cyan,
                    background: 'rgba(34, 211, 238, 0.08)',
                    border: `1px solid rgba(34, 211, 238, 0.2)`,
                    borderRadius: '6px',
                  }}
                >
                  {activeFile.name}
                </div>
                <div style={{ flex: 1 }} />
                <select
                  className="nx-ed-select"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    fontSize: '13px',
                    fontFamily: font,
                    color: C.text,
                    background: C.bgCard,
                    border: `1px solid ${C.border}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.id} value={lang.id} style={{ background: C.bgElevated }}>
                      {lang.label}
                    </option>
                  ))}
                </select>
                <button type="button" onClick={handleSave} style={toolbarBtn('save')}>
                  Save
                </button>
                <button type="button" onClick={handleRun} style={toolbarBtn('run')}>
                  ▶ Run
                </button>
              </div>

              {/* Editor + Terminal */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <div style={{ flex: 1, minHeight: 0, height: editorHeight }}>
                  <MonacoEditor
                    height="100%"
                    language={language}
                    theme="vs-dark"
                    value={editorValue}
                    onChange={setEditorValue}
                    options={{
                      fontSize: 14,
                      fontFamily: mono,
                      lineNumbers: 'on',
                      minimap: { enabled: true },
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      wordWrap: 'on',
                      tabSize: 2,
                      suggestOnTriggerCharacters: true,
                      quickSuggestions: true,
                      padding: { top: 12 },
                    }}
                  />
                </div>

                {/* Terminal */}
                <div style={{ flexShrink: 0, borderTop: `1px solid ${C.border}`, background: C.bgPanel }}>
                  <button
                    type="button"
                    onClick={() => setTerminalOpen((o) => !o)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 16px',
                      background: C.bgElevated,
                      border: 'none',
                      color: C.textMuted,
                      fontSize: '12px',
                      fontWeight: 600,
                      fontFamily: font,
                      cursor: 'pointer',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Terminal
                    <span>{terminalOpen ? '▼' : '▲'}</span>
                  </button>
                  {terminalOpen && (
                    <div
                      style={{
                        height: '140px',
                        overflowY: 'auto',
                        padding: '12px 16px',
                        fontFamily: mono,
                        fontSize: '13px',
                        lineHeight: 1.6,
                        color: '#34d399',
                        background: '#050508',
                      }}
                    >
                      {terminalLines.map((line, i) => (
                        <div key={i} style={{ color: line.startsWith('✓') ? '#34d399' : line.startsWith('>') ? C.cyan : C.textMuted }}>
                          {line}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* AI Panel — fixed header / scrollable messages / fixed input */}
            <aside
              style={{
                width: '380px',
                minWidth: '350px',
                flexShrink: 0,
                height: '100vh',
                maxHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                background: C.bgPanel,
                borderLeft: `1px solid ${C.border}`,
                overflow: 'hidden',
              }}
            >
              {/* Top: fixed header */}
              <div
                style={{
                  flexShrink: 0,
                  padding: '14px 16px',
                  borderBottom: `1px solid ${C.border}`,
                  background: 'linear-gradient(90deg, rgba(34,211,238,0.08), rgba(167,139,250,0.06))',
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>
                  <span style={{ color: C.text }}>Nexus </span>
                  <span
                    style={{
                      background: 'linear-gradient(135deg, #22d3ee, #a78bfa)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    AI
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: C.textDim }}>Code assistant</div>
              </div>

              <div
                style={{
                  flexShrink: 0,
                  padding: '10px 12px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '6px',
                  borderBottom: `1px solid ${C.border}`,
                }}
              >
                {AI_COMMANDS.map((cmd) => (
                  <button
                    key={cmd.id}
                    type="button"
                    disabled={aiLoading}
                    onClick={() => handleAiCommand(cmd.id)}
                    style={{
                      padding: '6px 10px',
                      fontSize: '11px',
                      fontWeight: 600,
                      fontFamily: font,
                      color: C.cyan,
                      background: 'rgba(34, 211, 238, 0.08)',
                      border: '1px solid rgba(34, 211, 238, 0.25)',
                      borderRadius: '8px',
                      cursor: aiLoading ? 'not-allowed' : 'pointer',
                      opacity: aiLoading ? 0.5 : 1,
                    }}
                  >
                    {cmd.label}
                  </button>
                ))}
              </div>

              {/* Middle: scrollable messages */}
              <div
                ref={chatScrollRef}
                style={{
                  flex: '1 1 auto',
                  minHeight: 0,
                  height: 'calc(100vh - 250px)',
                  maxHeight: 'calc(100vh - 250px)',
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  scrollBehavior: 'smooth',
                }}
              >
                {aiMessages.map((msg, i) => {
                  const isUser = msg.role === 'user';

                  return (
                    <div key={`${msg.role}-${i}`}>
                      <ChatBubble
                        role={msg.role}
                        error={msg.error}
                        animate
                        animationDelay={Math.min(i * 0.05, 0.25)}
                      >
                        {isUser || msg.error ? (
                          <span style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</span>
                        ) : (
                          <AiFormattedMessage text={msg.text} />
                        )}
                      </ChatBubble>
                    </div>
                  );
                })}

                {aiLoading && (
                  <div
                    className="nx-chat-fade-in"
                    style={{
                      alignSelf: 'flex-start',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px 16px',
                      borderRadius: '14px 14px 14px 4px',
                      background: 'linear-gradient(180deg, rgba(18, 18, 28, 0.98), rgba(12, 12, 20, 0.98))',
                      border: '1px solid rgba(0, 188, 212, 0.12)',
                      fontSize: '13px',
                      color: C.textMuted,
                    }}
                  >
                    <span
                      style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid rgba(34, 211, 238, 0.25)',
                        borderTopColor: C.cyan,
                        borderRadius: '50%',
                        animation: 'nx-spin 0.8s linear infinite',
                        flexShrink: 0,
                      }}
                    />
                    Nexus AI is analyzing your request...
                  </div>
                )}
                <div ref={chatEndRef} style={{ height: 1, flexShrink: 0 }} aria-hidden="true" />
              </div>

              {/* Bottom: fixed input */}
              <form
                onSubmit={handleAiSend}
                style={{
                  flexShrink: 0,
                  padding: '12px',
                  borderTop: `1px solid ${C.border}`,
                  background: C.bgPanel,
                }}
              >
                <textarea
                  className="nx-ed-ai-input"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="Ask Nexus AI..."
                  rows={3}
                  disabled={aiLoading}
                  style={{
                    width: '100%',
                    resize: 'none',
                    padding: '10px 12px',
                    marginBottom: '8px',
                    fontSize: '13px',
                    fontFamily: font,
                    color: C.text,
                    background: 'rgba(10, 10, 15, 0.8)',
                    border: `1px solid ${C.border}`,
                    borderRadius: '10px',
                    boxSizing: 'border-box',
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAiSend(e);
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={aiLoading || !aiInput.trim()}
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '14px',
                    fontWeight: 600,
                    fontFamily: font,
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: aiLoading || !aiInput.trim() ? 'not-allowed' : 'pointer',
                    opacity: aiLoading || !aiInput.trim() ? 0.55 : 1,
                    background: 'linear-gradient(135deg, #06b6d4, #7c3aed)',
                    boxShadow: '0 0 16px rgba(34, 211, 238, 0.3)',
                  }}
                >
                  {aiLoading ? 'Analyzing...' : 'Send'}
                </button>
              </form>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}

export default EditorPage;
