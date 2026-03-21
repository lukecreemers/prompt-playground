import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useStore } from '@/store';
import { AgentMessage } from '@/types';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Trash2, User, Bot } from 'lucide-react';
import { CopyButton } from '@/components/ui/copy-button';
import { detectVariables } from '@/lib/interpolate';
import { PromptBox } from '@/components/prompt-box/PromptBox';

interface MessageCardProps {
  message: AgentMessage;
  onDeleteHover?: (hovering: boolean) => void;
  onDelete?: () => void;
  deletable?: boolean;
  deleteTooltip?: string;
  highlighted?: boolean;
}

export function MessageCard({ message, onDeleteHover, onDelete, deletable = true, deleteTooltip, highlighted = false }: MessageCardProps) {
  const updateAgentMessage = useStore((s) => s.updateAgentMessage);
  const syncAgentVariables = useStore((s) => s.syncAgentVariables);
  const agentVariables = useStore((s) => s.agentVariables);
  const setAgentFocusVariable = useStore((s) => s.setAgentFocusVariable);
  const setAgentDrawerOpen = useStore((s) => s.setAgentDrawerOpen);
  const agentMessages = useStore((s) => s.agentMessages);
  const activeAgent = useStore((s) => s.activeAgent);
  const [text, setText] = useState(message.content);

  const allContent = useMemo(() => {
    const parts = [activeAgent?.systemPrompt || ''];
    for (const msg of agentMessages) {
      parts.push(msg.content);
    }
    return parts.join('\n');
  }, [activeAgent?.systemPrompt, agentMessages]);

  const detectedVars = useMemo(() => detectVariables(allContent), [allContent]);

  const prevContent = useRef(message.content);
  useEffect(() => {
    if (message.content !== prevContent.current) {
      prevContent.current = message.content;
      setText(message.content);
    }
  }, [message.content]);

  const handleChange = useCallback((newText: string) => {
    setText(newText);
  }, []);

  const handleBlur = useCallback(async () => {
    if (text !== message.content) {
      await updateAgentMessage(message.id, text);
      await syncAgentVariables();
    }
  }, [text, message.content, message.id, updateAgentMessage, syncAgentVariables]);

  const handleEditVariable = useCallback((varName: string) => {
    setAgentFocusVariable(varName);
    setAgentDrawerOpen(true);
  }, [setAgentFocusVariable, setAgentDrawerOpen]);

  const isUser = message.role === 'user';

  return (
    <div className={`rounded-lg border ${isUser ? 'border-border bg-card' : 'border-primary/20 bg-card'}`}>
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/50">
        <div className="flex items-center gap-1.5 text-xs font-medium">
          {isUser ? (
            <><User className="h-3 w-3" /> User</>
          ) : (
            <><Bot className="h-3 w-3" /> Assistant</>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          <CopyButton text={message.content} />
          {deletable && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  onMouseEnter={() => onDeleteHover?.(true)}
                  onMouseLeave={() => onDeleteHover?.(false)}
                  onClick={onDelete}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              {deleteTooltip && <TooltipContent side="left">{deleteTooltip}</TooltipContent>}
            </Tooltip>
          </TooltipProvider>
        )}
        </div>
      </div>
      <PromptBox
        value={text}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={isUser ? 'User message...' : 'Assistant message...'}
        existingVariables={detectedVars}
        variableValues={agentVariables}
        hasEditableVariables={true}
        onEditVariable={handleEditVariable}
        allowNewVariables={true}
        minHeight="4.5em"
        className="border-0 rounded-t-none resize-y overflow-auto"
      />
    </div>
  );
}
