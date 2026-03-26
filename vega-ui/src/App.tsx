import { useState } from 'react';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { useWebSocket } from './hooks/useWebSocket';
import { KanbanBoard } from './components/KanbanBoard';
import { AgentTabs } from './components/AgentTabs';
import { TaskChecklist } from './components/TaskChecklist';
import { TerminalStream } from './components/TerminalStream';

const PHASE_BADGE: Record<string, string> = {
  idle: 'bg-zinc-700 text-zinc-300',
  planning: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  building: 'bg-violet-500/20 text-violet-300 border border-violet-500/30',
  pending_human_review: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
  done: 'bg-green-500/20 text-green-300 border border-green-500/30',
};

export default function App() {
  const { vegaState, logs, checklists, connected } = useWebSocket();
  const [activeAgent, setActiveAgent] = useState<string | null>(null);

  const effectiveAgent =
    activeAgent ?? (vegaState.executionPipeline[0]?.agent ?? null);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Top bar */}
      <header className="border-b border-zinc-800 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold tracking-tight text-white">
            ⬡ Vega <span className="text-zinc-500 font-normal text-sm">Bullpen</span>
          </span>
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${PHASE_BADGE[vegaState.currentPhase] ?? PHASE_BADGE.idle}`}>
            {vegaState.currentPhase}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {vegaState.awaitingApprovalFor && (
            <div className="flex items-center gap-1.5 text-yellow-400 text-xs">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Run <code className="font-mono">/approve</code> to continue</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-xs">
            {connected ? (
              <>
                <Wifi className="h-3.5 w-3.5 text-green-400" />
                <span className="text-green-400">Live</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3.5 w-3.5 text-red-400 animate-pulse" />
                <span className="text-red-400">Reconnecting…</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Kanban board */}
      <section className="border-b border-zinc-800 shrink-0">
        <KanbanBoard vegaState={vegaState} />
      </section>

      {/* Agent tabs */}
      <section className="shrink-0">
        <AgentTabs
          pipeline={vegaState.executionPipeline}
          activeAgent={effectiveAgent}
          onSelect={setActiveAgent}
        />
      </section>

      {/* Main content: checklist + terminal split */}
      <section className="flex-1 flex overflow-hidden min-h-0">
        {/* Checklist panel */}
        <div className="w-80 shrink-0 border-r border-zinc-800 overflow-hidden">
          <TaskChecklist agent={effectiveAgent} checklists={checklists} />
        </div>

        {/* Terminal stream */}
        <div className="flex-1 overflow-hidden p-4">
          <TerminalStream agent={effectiveAgent} logs={logs} />
        </div>
      </section>
    </div>
  );
}
