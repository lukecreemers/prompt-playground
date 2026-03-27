import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MarkdownOutput } from '../prompt-tester/MarkdownOutput';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CopyButton } from '@/components/ui/copy-button';

interface CellDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  content: string;
}

export function CellDetailModal({ open, onOpenChange, title, content }: CellDetailModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[95vw] h-[90vh] max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <div className="flex items-center gap-2">
            <DialogTitle>{title}</DialogTitle>
            <CopyButton text={content} />
          </div>
        </DialogHeader>
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-6">
            <MarkdownOutput content={content} />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
