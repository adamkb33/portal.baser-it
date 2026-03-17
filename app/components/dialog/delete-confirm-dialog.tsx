import { Button, ConfirmDialog } from '~/ui';

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  cancelText?: string;
  confirmText?: string;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title = 'Er du sikker?',
  description = 'Denne handlingen kan ikke angres.',
  cancelText = 'Avbryt',
  confirmText = 'Slett',
}: DeleteConfirmDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      cancelAction={
        <Button type="button" variant="outline">
          {cancelText}
        </Button>
      }
      confirmAction={
        <Button type="button" variant="destructive" onClick={onConfirm}>
          {confirmText}
        </Button>
      }
    />
  );
}
