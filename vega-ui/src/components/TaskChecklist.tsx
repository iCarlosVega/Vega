import { useMemo } from 'react';
import { CheckSquare, Square } from 'lucide-react';

interface ChecklistItem {
  checked: boolean;
  label: string;
}

function parseChecklist(markdown: string): ChecklistItem[] {
  const items: ChecklistItem[] = [];
  for (const line of markdown.split('\n')) {
    const checked = /^- \[x\]/i.test(line.trim());
    const unchecked = /^- \[ \]/.test(line.trim());
    if (checked || unchecked) {
      const label = line.trim().replace(/^- \[[ x]\] ?/i, '');
      items.push({ checked, label });
    }
  }
  return items;
}

function extractSection(markdown: string, heading: string): string {
  const lines = markdown.split('\n');
  const start = lines.findIndex((l) => l.trim().startsWith(`## ${heading}`));
  if (start === -1) return '';
  const end = lines.findIndex((l, i) => i > start && l.startsWith('## '));
  return lines.slice(start, end === -1 ? undefined : end).join('\n');
}

interface TaskChecklistProps {
  agent: string | null;
  checklists: Record<string, string>;
}

export function TaskChecklist({ agent, checklists }: TaskChecklistProps) {
  const markdown = agent ? (checklists[agent] ?? '') : '';

  const items = useMemo(() => {
    const section = extractSection(markdown, 'Task Checklist');
    return parseChecklist(section || markdown);
  }, [markdown]);

  const currentlyOn = useMemo(() => {
    const section = extractSection(markdown, 'Currently Working On');
    return section
      .split('\n')
      .slice(1)
      .join('\n')
      .trim();
  }, [markdown]);

  const completed = items.filter((i) => i.checked).length;
  const total = items.length;

  if (!agent) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-600 text-sm">
        Select an agent to view its checklist
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-600 text-sm italic">
        {markdown ? 'No checklist items found' : 'Waiting for agent to initialize...'}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2 border-b border-zinc-800 flex items-center justify-between shrink-0">
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Task Checklist
        </span>
        <span className="text-xs text-zinc-500">
          {completed}/{total} done
        </span>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="h-1 bg-zinc-800 shrink-0">
          <div
            className="h-full bg-violet-500 transition-all duration-300"
            style={{ width: `${(completed / total) * 100}%` }}
          />
        </div>
      )}

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2">
            {item.checked ? (
              <CheckSquare className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
            ) : (
              <Square className="h-4 w-4 text-zinc-600 shrink-0 mt-0.5" />
            )}
            <span className={`text-sm leading-snug ${item.checked ? 'text-zinc-500 line-through' : 'text-zinc-300'}`}>
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Currently Working On */}
      {currentlyOn && (
        <div className="border-t border-zinc-800 px-4 py-3 shrink-0">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
            Currently Working On
          </p>
          <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap">{currentlyOn}</p>
        </div>
      )}
    </div>
  );
}
