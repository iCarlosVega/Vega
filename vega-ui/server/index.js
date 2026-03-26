import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import chokidar from 'chokidar';
import { readFileSync, existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { resolve, basename, extname, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Server lives at vega-ui/server/ — root is two levels up
const ROOT = resolve(__dirname, '../../');

const PORT = 3001;
const STATE_PATH = resolve(ROOT, '.claude-vega/state.json');
const LOGS_DIR = resolve(ROOT, '.claude-vega/logs');
const ARTIFACTS_DIR = resolve(ROOT, '.claude-vega/artifacts');

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// --- Helpers ---

function broadcast(data) {
  const message = JSON.stringify(data);
  for (const client of wss.clients) {
    if (client.readyState === 1) {
      client.send(message);
    }
  }
}

function parseAgentName(filePath) {
  return basename(filePath, extname(filePath)).replace('_state', '');
}

function safeReadJSON(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

// Track log file sizes for tailing new content only
const logFileSizes = new Map();

// --- REST endpoints ---

app.get('/api/state', (_req, res) => {
  const state = safeReadJSON(STATE_PATH);
  if (!state) return res.status(404).json({ error: 'state.json not found' });
  res.json(state);
});

app.get('/api/logs/:agent', async (req, res) => {
  const logPath = resolve(LOGS_DIR, `${req.params.agent}.log`);
  if (!existsSync(logPath)) return res.status(404).json({ error: 'Log not found' });
  try {
    const content = await readFile(logPath, 'utf8');
    const lines = content.split('\n').filter(Boolean);
    res.json({ agent: req.params.agent, lines: lines.slice(-500) });
  } catch {
    res.status(500).json({ error: 'Failed to read log' });
  }
});

// --- WebSocket connection ---

wss.on('connection', (ws) => {
  console.log('[vega-ui] Client connected');

  // Send current state on connect
  const state = safeReadJSON(STATE_PATH);
  if (state) {
    ws.send(JSON.stringify({ type: 'state', data: state }));
  }

  ws.on('close', () => console.log('[vega-ui] Client disconnected'));
});

// --- File watchers ---

// 1. Watch state.json
chokidar.watch(STATE_PATH, { ignoreInitial: true }).on('change', () => {
  const state = safeReadJSON(STATE_PATH);
  if (state) broadcast({ type: 'state', data: state });
});

// 2. Watch log files — tail new lines only
chokidar.watch(`${LOGS_DIR}/*.log`, { ignoreInitial: false }).on('change', async (filePath) => {
  const agent = parseAgentName(filePath);
  try {
    const content = await readFile(filePath, 'utf8');
    const prevSize = logFileSizes.get(filePath) ?? 0;
    const newContent = content.slice(prevSize);
    logFileSizes.set(filePath, content.length);
    if (newContent.trim()) {
      for (const line of newContent.split('\n').filter(Boolean)) {
        broadcast({ type: 'log', agent, data: line });
      }
    }
  } catch {
    // file may have been truncated or removed
  }
}).on('add', (filePath) => {
  logFileSizes.set(filePath, 0);
});

// 3. Watch agent state markdown files in artifacts
chokidar.watch(`${ARTIFACTS_DIR}/*_state.md`, { ignoreInitial: false }).on('change', async (filePath) => {
  const agent = parseAgentName(filePath);
  try {
    const content = await readFile(filePath, 'utf8');
    broadcast({ type: 'checklist', agent, data: content });
  } catch {
    // ignore
  }
}).on('add', async (filePath) => {
  const agent = parseAgentName(filePath);
  try {
    const content = await readFile(filePath, 'utf8');
    broadcast({ type: 'checklist', agent, data: content });
  } catch {
    // ignore
  }
});

// --- Start ---

server.listen(PORT, () => {
  console.log(`[vega-ui] Server running at http://localhost:${PORT}`);
  console.log(`[vega-ui] Watching:`);
  console.log(`  state.json   → ${STATE_PATH}`);
  console.log(`  logs         → ${LOGS_DIR}/*.log`);
  console.log(`  artifacts    → ${ARTIFACTS_DIR}/*_state.md`);
});
