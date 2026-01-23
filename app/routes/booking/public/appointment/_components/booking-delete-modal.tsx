import type { ReactNode } from 'react';
import { XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '~/components/ui/dialog';
import { BookingButton } from './booking-layout';

interface BookingDeleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  confirmAction: ReactNode;
  title?: string;
  description?: string;
  cancelLabel?: string;
}

export function BookingDeleteModal({
  open,
  onOpenChange,
  confirmAction,
  title = 'Bekreft avbestilling',
  description = 'Avbestillingen kan ikke angres.',
  cancelLabel = 'Avbryt',
}: BookingDeleteModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm gap-0 p-0">
        <DialogHeader className="border-b border-card-border bg-destructive/5 p-4 text-left md:p-6">
          <div className="flex items-start gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-destructive/15 text-destructive">
              <XCircle className="size-5" strokeWidth={2.5} />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-base font-bold text-card-text md:text-lg">{title}</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="space-y-4 p-4 md:p-6">
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <BookingButton type="button" variant="outline" size="md" className="w-full sm:w-auto">
                {cancelLabel}
              </BookingButton>
            </DialogClose>
            {confirmAction}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
