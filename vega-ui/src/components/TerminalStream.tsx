import { useEffect, useRef } from 'react';

interface TerminalStreamProps {
  agent: string | null;
  logs: Record<string, string[]>;
}

export function TerminalStream({ agent, logs }: TerminalStreamProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const lines = agent ? (logs[agent] ?? []) : [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  if (!agent) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-600 text-sm font-mono">
        Select an agent to view its log stream
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-black/30 rounded-md border border-zinc-800">
      {/* Header */}
      <div className="px-4 py-2 border-b border-zinc-800 flex items-center gap-2 shrink-0">
        <span className="h-2 w-2 rounded-full bg-green-400" />
        <span className="text-xs font-mono text-zinc-400">
          {agent}.log
        </span>
        <span className="ml-auto text-xs text-zinc-600">{lines.length} lines</span>
      </div>

      {/* Log lines */}
      <div className="flex-1 overflow-y-auto px-4 py-3 font-mono text-xs leading-relaxed space-y-0.5">
        {lines.length === 0 ? (
          <span className="text-zinc-600 italic">Waiting for output...</span>
        ) : (
          lines.map((line, i) => (
            <div key={i} className="text-zinc-300 whitespace-pre-wrap break-all">
              {line}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
