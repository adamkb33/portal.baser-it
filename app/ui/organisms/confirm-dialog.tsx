import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../primitives/dialog';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmAction: React.ReactNode;
  cancelAction?: React.ReactNode;
  children?: React.ReactNode;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmAction,
  cancelAction,
  children,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children ? <div>{children}</div> : null}
        <DialogFooter>
          {cancelAction ? <DialogClose asChild>{cancelAction}</DialogClose> : null}
          {confirmAction}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
