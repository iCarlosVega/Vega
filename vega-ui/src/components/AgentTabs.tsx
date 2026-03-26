import type { PipelineEntry } from '../hooks/useWebSocket';

const STATUS_DOT: Record<string, string> = {
  idle: 'bg-zinc-500',
  running: 'bg-blue-400 animate-pulse',
  blocked: 'bg-yellow-400',
  failed: 'bg-red-400',
  completed: 'bg-green-400',
};

interface AgentTabsProps {
  pipeline: PipelineEntry[];
  activeAgent: string | null;
  onSelect: (agent: string) => void;
}

export function AgentTabs({ pipeline, activeAgent, onSelect }: AgentTabsProps) {
  if (pipeline.length === 0) {
    return (
      <div className="px-4 py-2 border-b border-zinc-800">
        <p className="text-xs text-zinc-600 italic">No agents in pipeline — run /plan to start</p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 px-4 py-2 border-b border-zinc-800 overflow-x-auto">
      {pipeline.map((entry) => {
        const status = entry.status ?? 'idle';
        const isActive = activeAgent === entry.agent;
        return (
          <button
            key={entry.agent}
            onClick={() => onSelect(entry.agent)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-mono whitespace-nowrap transition-colors ${
              isActive
                ? 'bg-zinc-700 text-zinc-100'
                : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
            }`}
          >
            <span className={`h-2 w-2 rounded-full shrink-0 ${STATUS_DOT[status] ?? STATUS_DOT.idle}`} />
            {entry.agent}
          </button>
        );
      })}
    </div>
  );
}
