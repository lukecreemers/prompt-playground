import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Plus, Pencil, Check } from 'lucide-react';

interface InputOutputEditorProps {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  color?: string;
}

export function InputOutputEditor({ label, items, onChange, color = 'bg-blue-500/10 text-blue-500' }: InputOutputEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [adding, setAdding] = useState(false);
  const [newValue, setNewValue] = useState('');

  const handleRemove = useCallback((index: number) => {
    onChange(items.filter((_, i) => i !== index));
  }, [items, onChange]);

  const handleStartEdit = useCallback((index: number) => {
    setEditingIndex(index);
    setEditValue(items[index]);
  }, [items]);

  const handleSaveEdit = useCallback(() => {
    if (editingIndex === null) return;
    const trimmed = editValue.trim();
    if (trimmed && !items.some((item, i) => i !== editingIndex && item === trimmed)) {
      const updated = [...items];
      updated[editingIndex] = trimmed;
      onChange(updated);
    }
    setEditingIndex(null);
  }, [editingIndex, editValue, items, onChange]);

  const handleAdd = useCallback(() => {
    const trimmed = newValue.trim();
    if (trimmed && !items.includes(trimmed)) {
      onChange([...items, trimmed]);
      setNewValue('');
      setAdding(false);
    }
  }, [newValue, items, onChange]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => { setAdding(true); setNewValue(''); }}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, i) => (
          <div key={i} className={`group flex items-center gap-1 rounded-md px-2 py-1 text-xs font-mono ${color}`}>
            {editingIndex === i ? (
              <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }} className="flex items-center gap-1">
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="h-5 w-20 text-xs px-1 py-0"
                  autoFocus
                  onBlur={handleSaveEdit}
                />
                <button type="submit">
                  <Check className="h-3 w-3" />
                </button>
              </form>
            ) : (
              <>
                <span>{item}</span>
                <button
                  onClick={() => handleStartEdit(i)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Pencil className="h-2.5 w-2.5" />
                </button>
                <button
                  onClick={() => handleRemove(i)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </>
            )}
          </div>
        ))}
      </div>
      {adding && (
        <form onSubmit={(e) => { e.preventDefault(); handleAdd(); }} className="flex items-center gap-1.5">
          <Input
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder={`New ${label.toLowerCase().replace(/s$/, '')}...`}
            className="h-7 text-xs font-mono"
            autoFocus
            onBlur={() => { if (!newValue.trim()) setAdding(false); }}
          />
          <Button type="submit" variant="outline" size="sm" className="h-7 text-xs px-2">
            Add
          </Button>
        </form>
      )}
      {items.length === 0 && !adding && (
        <p className="text-xs text-muted-foreground/50">No {label.toLowerCase()} defined</p>
      )}
    </div>
  );
}
