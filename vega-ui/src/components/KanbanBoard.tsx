import type { VegaState, PipelineEntry } from '../hooks/useWebSocket';

const PHASES = ['idle', 'planning', 'building', 'pending_human_review', 'done'] as const;

const PHASE_LABELS: Record<string, string> = {
  idle: 'Idle',
  planning: 'Planning',
  building: 'Building',
  pending_human_review: 'Awaiting Review',
  done: 'Done',
};

const STATUS_COLORS: Record<string, string> = {
  idle: 'bg-zinc-700 text-zinc-300',
  running: 'bg-blue-500/20 text-blue-300 border border-blue-500/40',
  blocked: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40',
  failed: 'bg-red-500/20 text-red-300 border border-red-500/40',
  completed: 'bg-green-500/20 text-green-300 border border-green-500/40',
};

function AgentCard({ entry }: { entry: PipelineEntry }) {
  const status = entry.status ?? 'idle';
  return (
    <div className="rounded-md bg-zinc-800 border border-zinc-700 px-3 py-2 space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-mono text-zinc-200">{entry.agent}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[status] ?? STATUS_COLORS.idle}`}>
          {status}
        </span>
      </div>
      {entry.description && (
        <p className="text-xs text-zinc-500 truncate">{entry.description}</p>
      )}
    </div>
  );
}

export function KanbanBoard({ vegaState }: { vegaState: VegaState }) {
  const agentsByPhase = (phase: string): PipelineEntry[] => {
    if (phase !== vegaState.currentPhase) return [];
    return vegaState.executionPipeline;
  };

  return (
    <div className="grid grid-cols-5 gap-3 p-4">
      {PHASES.map((phase) => {
        const isActive = vegaState.currentPhase === phase;
        return (
          <div
            key={phase}
            className={`rounded-lg border p-3 space-y-2 min-h-[120px] transition-colors ${
              isActive
                ? 'border-violet-500/50 bg-violet-500/5'
                : 'border-zinc-700 bg-zinc-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                {PHASE_LABELS[phase]}
              </h3>
              {isActive && (
                <span className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
              )}
            </div>

            <div className="space-y-2">
              {agentsByPhase(phase).map((entry) => (
                <AgentCard key={entry.agent} entry={entry} />
              ))}

              {isActive && vegaState.executionPipeline.length === 0 && (
                <p className="text-xs text-zinc-600 italic">No agents assigned</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
