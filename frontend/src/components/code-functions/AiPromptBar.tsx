import { useState } from "react";
import { useStore } from "@/store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUp, Square, Check, X, Loader2 } from "lucide-react";

export function AiPromptBar() {
  const [instruction, setInstruction] = useState("");
  const models = useStore((s) => s.models);
  const codeAiModel = useStore((s) => s.codeAiModel);
  const codeAiStatus = useStore((s) => s.codeAiStatus);
  const codeAiProposal = useStore((s) => s.codeAiProposal);
  const codeAiError = useStore((s) => s.codeAiError);
  const setCodeAiModel = useStore((s) => s.setCodeAiModel);
  const sendCodeAiInstruction = useStore((s) => s.sendCodeAiInstruction);
  const cancelCodeAi = useStore((s) => s.cancelCodeAi);
  const acceptCodeAiProposal = useStore((s) => s.acceptCodeAiProposal);
  const rejectCodeAiProposal = useStore((s) => s.rejectCodeAiProposal);

  const isRunning = codeAiStatus === "running";
  const hasProposal = codeAiProposal !== null;

  const handleSubmit = () => {
    const trimmed = instruction.trim();
    if (!trimmed || isRunning) return;
    sendCodeAiInstruction(trimmed);
    setInstruction("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSend = instruction.trim().length > 0 && !hasProposal;

  return (
    <div className="shrink-0 border-t border-border">
      {/* Proposal bar */}
      {hasProposal && (
        <div className="px-4 py-2 flex items-center gap-2 border-b border-border bg-accent/30">
          <span className="text-xs text-muted-foreground flex-1 truncate">
            {codeAiProposal!.explanation}
          </span>
          <button
            onClick={acceptCodeAiProposal}
            className="h-7 px-3 text-xs font-medium flex items-center gap-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
          >
            <Check className="h-3 w-3" />
            Accept
          </button>
          <button
            onClick={rejectCodeAiProposal}
            className="h-7 px-3 text-xs font-medium flex items-center gap-1.5 rounded-md border border-border hover:bg-muted text-muted-foreground"
          >
            <X className="h-3 w-3" />
            Reject
          </button>
        </div>
      )}

      {/* Error */}
      {codeAiError && (
        <div className="px-4 py-1.5 border-b border-border">
          <span className="text-xs text-destructive">{codeAiError}</span>
        </div>
      )}

      {/* Header: label + model + status */}
      <div className="px-4 py-2 flex items-center gap-2 border-b border-border">
        <span className="section-label">AI Assist</span>
        <Select
          value={codeAiModel}
          onValueChange={setCodeAiModel}
        >
          <SelectTrigger className="h-6 w-auto gap-1 border-0 bg-transparent px-1.5 text-[11px] text-muted-foreground hover:text-foreground [&>svg]:h-3 [&>svg]:w-3">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {models.map((m) => (
              <SelectItem
                key={m.id}
                value={m.id}
              >
                {m.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isRunning && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground ml-auto">
            <Loader2 className="h-3 w-3 animate-spin" />
            Thinking...
          </span>
        )}
      </div>

      {/* Textarea + send */}
      <div className="relative">
        <textarea
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isRunning || hasProposal}
          placeholder="Describe a code change..."
          rows={6}
          className="block w-full resize-none bg-transparent px-4 py-2.5 pr-12 text-sm font-mono placeholder:text-muted-foreground/50 focus:outline-none focus-visible:!shadow-none disabled:opacity-50 overflow-y-auto"
        />
        <div className="absolute right-3 bottom-2.5">
          {isRunning ? (
            <button
              onClick={cancelCodeAi}
              className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground focus-visible:!shadow-none"
              title="Stop"
            >
              <Square className="h-3 w-3 fill-current" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canSend}
              className="h-6 w-6 flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-20 disabled:pointer-events-none focus-visible:!shadow-none"
              title="Send"
            >
              <ArrowUp className="h-3.5 w-3.5 stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
