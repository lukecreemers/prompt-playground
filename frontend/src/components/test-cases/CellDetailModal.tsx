import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MarkdownOutput } from '../prompt-tester/MarkdownOutput';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CellDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  content: string;
}

export function CellDetailModal({ open, onOpenChange, title, content }: CellDetailModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="p-6">
            <MarkdownOutput content={content} />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
