import { useState, useRef, useEffect } from 'react';
import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { ChevronDown, Plus, MoreHorizontal, Trash2 } from 'lucide-react';

export function AgentNameEditor() {
  const activeAgent = useStore((s) => s.activeAgent);
  const agents = useStore((s) => s.agents);
  const updateAgent = useStore((s) => s.updateAgent);
  const setActiveAgent = useStore((s) => s.setActiveAgent);
  const createAgent = useStore((s) => s.createAgent);
  const deleteAgent = useStore((s) => s.deleteAgent);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeAgent) setName(activeAgent.name);
  }, [activeAgent?.id]);

  const handleSaveName = () => {
    if (name.trim() && name !== activeAgent?.name) {
      updateAgent({ name: name.trim() });
    }
    setEditing(false);
  };

  if (!activeAgent) {
    return (
      <Button variant="outline" size="sm" onClick={createAgent} className="gap-1.5">
        <Plus className="h-3.5 w-3.5" /> New Agent
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-1 min-w-0">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="px-1.5 h-7">
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-1.5" align="start">
          <div className="space-y-0.5">
            {agents.map((a) => (
              <div
                key={a.id}
                className={`group flex items-center justify-between px-2.5 py-1.5 rounded-md text-sm cursor-pointer hover:bg-muted ${
                  a.id === activeAgent.id ? 'bg-accent text-accent-foreground border-l-2 border-primary' : ''
                }`}
                onClick={() => { setActiveAgent(a.id); setOpen(false); }}
              >
                <span className="truncate">{a.name}</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={(e) => { e.stopPropagation(); deleteAgent(a.id); }}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
            <div className="border-t border-border mt-1 pt-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start h-8 text-muted-foreground hover:text-foreground"
                onClick={() => { createAgent(); setOpen(false); }}
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" /> New Agent
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {editing ? (
        <Input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleSaveName}
          onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
          className="h-7 text-sm font-semibold w-48 bg-muted"
          autoFocus
        />
      ) : (
        <button
          className="text-sm font-semibold hover:bg-muted px-2 py-1 rounded-md truncate max-w-48 text-foreground"
          onClick={() => setEditing(true)}
        >
          {activeAgent.name}
        </button>
      )}

      <span className="text-xs text-muted-foreground ml-2 whitespace-nowrap">
        {activeAgent.updatedAt && `Saved ${new Date(activeAgent.updatedAt).toLocaleTimeString()}`}
      </span>
    </div>
  );
}
