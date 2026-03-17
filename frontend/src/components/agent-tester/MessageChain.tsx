import { useStore } from '@/store';
import { MessageCard } from './MessageCard';
import { Button } from '@/components/ui/button';
import { Plus, MessageSquare } from 'lucide-react';

export function MessageChain() {
  const activeAgent = useStore((s) => s.activeAgent);
  const agentMessages = useStore((s) => s.agentMessages);
  const addAgentMessagePair = useStore((s) => s.addAgentMessagePair);

  if (!activeAgent) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3 border border-dashed border-border rounded-xl p-8 text-center">
          <MessageSquare className="h-10 w-10 text-muted-foreground/40" />
          <h3 className="text-sm font-medium text-foreground">No agent selected</h3>
          <p className="text-xs text-muted-foreground">Select or create an agent to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-2">
      <h3 className="section-label mb-2">Messages</h3>
      {agentMessages.map((msg, i) => (
        <MessageCard key={msg.id} message={msg} deletable={i !== 0} />
      ))}
      <Button
        variant="ghost"
        size="sm"
        className="w-full text-muted-foreground hover:text-foreground gap-1.5 mt-2"
        onClick={() => addAgentMessagePair()}
      >
        <Plus className="h-3.5 w-3.5" /> Add Message Pair
      </Button>
    </div>
  );
}
