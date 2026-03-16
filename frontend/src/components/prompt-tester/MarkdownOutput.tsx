interface MarkdownOutputProps {
  content: string;
}

export function MarkdownOutput({ content }: MarkdownOutputProps) {
  return (
    <div className="text-sm whitespace-pre-wrap break-words leading-relaxed text-foreground/90">
      {content}
    </div>
  );
}
