import { useState, useRef, useEffect } from 'react';
import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { ChevronDown, Plus, MoreHorizontal, Trash2 } from 'lucide-react';

export function PromptNameEditor() {
  const activePrompt = useStore((s) => s.activePrompt);
  const prompts = useStore((s) => s.prompts);
  const updatePrompt = useStore((s) => s.updatePrompt);
  const setActivePrompt = useStore((s) => s.setActivePrompt);
  const createPrompt = useStore((s) => s.createPrompt);
  const deletePrompt = useStore((s) => s.deletePrompt);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activePrompt) setName(activePrompt.name);
  }, [activePrompt?.id]);

  const handleSaveName = () => {
    if (name.trim() && name !== activePrompt?.name) {
      updatePrompt({ name: name.trim() });
    }
    setEditing(false);
  };

  if (!activePrompt) {
    return (
      <Button variant="outline" size="sm" onClick={createPrompt} className="gap-1.5">
        <Plus className="h-3.5 w-3.5" /> New Prompt
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
            {prompts.map((p) => (
              <div
                key={p.id}
                className={`group flex items-center justify-between px-2.5 py-1.5 rounded-md text-sm cursor-pointer hover:bg-muted ${
                  p.id === activePrompt.id ? 'bg-accent text-accent-foreground border-l-2 border-primary' : ''
                }`}
                onClick={() => { setActivePrompt(p.id); setOpen(false); }}
              >
                <span className="truncate">{p.name}</span>
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
                      onClick={(e) => { e.stopPropagation(); deletePrompt(p.id); }}
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
                onClick={() => { createPrompt(); setOpen(false); }}
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" /> New Prompt
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
          {activePrompt.name}
        </button>
      )}

      <span className="text-xs text-muted-foreground ml-2 whitespace-nowrap">
        {activePrompt.updatedAt && `Saved ${new Date(activePrompt.updatedAt).toLocaleTimeString()}`}
      </span>
    </div>
  );
}
