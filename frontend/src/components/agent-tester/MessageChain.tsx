import { useState, useEffect, useMemo } from 'react';
import { useStore } from '@/store';
import { MessageCard } from './MessageCard';
import { Button } from '@/components/ui/button';
import { Plus, MessageSquare } from 'lucide-react';
import { AgentMessage } from '@/types';

interface MessagePair {
  assistant: AgentMessage;
  user: AgentMessage;
}

export function MessageChain() {
  const activeAgent = useStore((s) => s.activeAgent);
  const agentMessages = useStore((s) => s.agentMessages);
  const addAgentMessagePair = useStore((s) => s.addAgentMessagePair);
  const addAgentUserMessage = useStore((s) => s.addAgentUserMessage);
  const deleteAgentMessagePair = useStore((s) => s.deleteAgentMessagePair);
  const deleteAgentMessage = useStore((s) => s.deleteAgentMessage);
  const [hoveredPairIndex, setHoveredPairIndex] = useState<number | null>(null);

  // Reset hover state when messages change (e.g. after delete or add-to-chain)
  useEffect(() => {
    setHoveredPairIndex(null);
  }, [agentMessages]);

  const lastMessage = agentMessages[agentMessages.length - 1];
  const lastIsAssistant = lastMessage?.role === 'assistant';

  // First message is always the standalone user message (index 0).
  // After that, messages come in assistant+user pairs.
  // A trailing lone assistant (after "Add to Chain") is also possible.
  const firstUser = agentMessages[0] || null;
  const { pairs, trailingAssistant, trailingUser } = useMemo(() => {
    const rest = agentMessages.slice(1);
    const pairs: MessagePair[] = [];
    let trailingAssistant: AgentMessage | null = null;
    let trailingUser: AgentMessage | null = null;

    for (let i = 0; i < rest.length; i++) {
      const msg = rest[i];
      const next = rest[i + 1];
      if (msg.role === 'assistant' && next?.role === 'user') {
        pairs.push({ assistant: msg, user: next });
        i++; // skip the user
      } else if (msg.role === 'assistant') {
        trailingAssistant = msg;
      } else if (msg.role === 'user') {
        trailingUser = msg;
      }
    }
    return { pairs, trailingAssistant, trailingUser };
  }, [agentMessages]);

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

      {firstUser && (
        <MessageCard message={firstUser} deletable={false} />
      )}

      {pairs.map((pair, i) => (
        <div
          key={pair.assistant.id}
          className={`space-y-2 rounded-lg p-1.5 -mx-1.5 transition-colors ${
            hoveredPairIndex === i ? 'bg-destructive/10 ring-1 ring-destructive/30' : ''
          }`}
        >
          <MessageCard
            message={pair.assistant}
            deletable
            deleteTooltip="Delete pair to maintain alternation"
            onDeleteHover={(h) => setHoveredPairIndex(h ? i : null)}
            onDelete={() => deleteAgentMessagePair(pair.assistant.id, pair.user.id)}
          />
          <MessageCard
            message={pair.user}
            deletable
            deleteTooltip="Delete pair to maintain alternation"
            onDeleteHover={(h) => setHoveredPairIndex(h ? i : null)}
            onDelete={() => deleteAgentMessagePair(pair.assistant.id, pair.user.id)}
          />
        </div>
      ))}

      {trailingAssistant && (
        <MessageCard
          message={trailingAssistant}
          deletable
          onDelete={() => deleteAgentMessage(trailingAssistant.id)}
        />
      )}

      {trailingUser && (
        <MessageCard
          message={trailingUser}
          deletable
          onDelete={() => deleteAgentMessage(trailingUser.id)}
        />
      )}

      <Button
        variant="ghost"
        size="sm"
        className="w-full text-muted-foreground hover:text-foreground gap-1.5 mt-2"
        onClick={lastIsAssistant ? addAgentUserMessage : () => addAgentMessagePair()}
      >
        <Plus className="h-3.5 w-3.5" /> {lastIsAssistant ? 'Add User Message' : 'Add Message Pair'}
      </Button>
    </div>
  );
}
