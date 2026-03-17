import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { cn } from '@/lib/utils';

export interface SuggestionDropdownRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

interface SuggestionDropdownProps {
  items: string[];
  command: (props: { name: string }) => void;
}

export const SuggestionDropdown = forwardRef<SuggestionDropdownRef, SuggestionDropdownProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => {
      setSelectedIndex(0);
    }, [items]);

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (event.key === 'ArrowUp') {
          setSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
          return true;
        }
        if (event.key === 'ArrowDown') {
          setSelectedIndex((prev) => (prev + 1) % items.length);
          return true;
        }
        if (event.key === 'Enter' || event.key === 'Tab') {
          if (items[selectedIndex]) {
            command({ name: items[selectedIndex] });
          }
          return true;
        }
        if (event.key === 'Escape') {
          return true;
        }
        return false;
      },
    }));

    if (items.length === 0) return null;

    return (
      <div className="bg-popover border border-border rounded-md shadow-lg overflow-hidden">
        {items.map((item, index) => (
          <div
            key={item}
            className={cn(
              'px-3 py-1.5 text-sm font-mono cursor-pointer hover:bg-accent/50',
              index === selectedIndex && 'bg-accent text-accent-foreground',
            )}
            onMouseDown={(e) => {
              e.preventDefault();
              command({ name: item });
            }}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            {item}
          </div>
        ))}
      </div>
    );
  },
);

SuggestionDropdown.displayName = 'SuggestionDropdown';
