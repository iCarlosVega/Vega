import { useEffect, useRef, useState } from 'react';

export interface VegaState {
  currentPhase: string;
  status: string;
  planApproved: boolean;
  awaitingApprovalFor: string | null;
  availableAgents: string[];
  executionPipeline: PipelineEntry[];
  actionQueue: ActionQueueEntry[];
  activeBriefs: Record<string, string>;
  consultLogs: ConsultLogEntry[];
}

export interface PipelineEntry {
  agent: string;
  phase?: number;
  status?: 'idle' | 'running' | 'blocked' | 'failed' | 'completed';
  description?: string;
}

export interface ActionQueueEntry {
  agent: string;
  status: string;
  blocker_reason?: string;
  failure_summary?: string;
  timestamp?: string;
}

export interface ConsultLogEntry {
  timestamp: string;
  target: string;
  reason: string;
  expectedOutcome: string;
}

const DEFAULT_STATE: VegaState = {
  currentPhase: 'idle',
  status: 'healthy',
  planApproved: false,
  awaitingApprovalFor: null,
  availableAgents: [],
  executionPipeline: [],
  actionQueue: [],
  activeBriefs: {},
  consultLogs: [],
};

const MAX_LOG_LINES = 1000;

export function useWebSocket() {
  const [vegaState, setVegaState] = useState<VegaState>(DEFAULT_STATE);
  const [logs, setLogs] = useState<Record<string, string[]>>({});
  const [checklists, setChecklists] = useState<Record<string, string>>({});
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Load initial state via REST
    fetch('/api/state')
      .then((r) => r.json())
      .then((data: VegaState) => setVegaState(data))
      .catch(() => {/* server not yet ready */});
  }, []);

  useEffect(() => {
    function connect() {
      const ws = new WebSocket('ws://localhost:3001');
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string) as {
            type: 'state' | 'log' | 'checklist';
            agent?: string;
            data: unknown;
          };

          if (msg.type === 'state') {
            setVegaState(msg.data as VegaState);
          } else if (msg.type === 'log' && msg.agent) {
            const line = msg.data as string;
            setLogs((prev) => {
              const existing = prev[msg.agent!] ?? [];
              const updated = [...existing, line];
              return {
                ...prev,
                [msg.agent!]: updated.slice(-MAX_LOG_LINES),
              };
            });
          } else if (msg.type === 'checklist' && msg.agent) {
            setChecklists((prev) => ({
              ...prev,
              [msg.agent!]: msg.data as string,
            }));
          }
        } catch {
          // malformed message
        }
      };

      ws.onclose = () => {
        setConnected(false);
        reconnectTimer.current = setTimeout(connect, 3000);
      };

      ws.onerror = () => ws.close();
    }

    connect();

    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, []);

  return { vegaState, logs, checklists, connected };
}
