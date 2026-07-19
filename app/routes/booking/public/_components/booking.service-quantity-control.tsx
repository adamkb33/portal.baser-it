import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button, ButtonGroup, cn } from '~/ui';

type ServiceQuantityControlProps = {
  quantity: number;
  onChange: (nextQuantity: number) => void;
  className?: string;
  /** Disables only the actions that would increase the total (select / +), never removal. */
  disableIncrement?: boolean;
};

export function ServiceQuantityControl({
  quantity,
  onChange,
  className,
  disableIncrement = false,
}: ServiceQuantityControlProps) {
  if (quantity <= 0) {
    return (
      <Button
        type="button"
        disabled={disableIncrement}
        onClick={(event) => {
          event.stopPropagation();
          onChange(1);
        }}
        className={cn('flex-1 gap-2', className)}
        variant="booking-primary"
      >
        Velg
      </Button>
    );
  }

  if (quantity === 1) {
    return (
      <ButtonGroup className={cn('flex-1', className)}>
        <Button
          type="button"
          variant="destructive"
          className="w-full"
          aria-label="Fjern tjeneste"
          onClick={(event) => {
            event.stopPropagation();
            onChange(0);
          }}
        >
          <Trash2 className="size-5 sm:hidden" />
          <span className="hidden sm:inline">Fjern</span>
        </Button>
        <Button
          type="button"
          disabled={disableIncrement}
          onClick={(event) => {
            event.stopPropagation();
            onChange(2);
          }}
          className="w-full gap-1 px-2 text-sm md:gap-2 md:px-4 md:text-base"
          variant="booking-primary"
          aria-label="Legg til en til"
        >
          <Plus className="size-5" />
        </Button>
      </ButtonGroup>
    );
  }

  return (
    <ButtonGroup className={cn('flex-1', className)}>
      <Button
        type="button"
        variant="booking-primary"
        className="w-full"
        aria-label="Reduser antall"
        onClick={(event) => {
          event.stopPropagation();
          onChange(Math.max(0, quantity - 1));
        }}
      >
        <Minus className="size-5" />
      </Button>
      <Button
        type="button"
        variant="booking-secondary"
        className="w-full"
        disabled={disableIncrement}
        aria-label="Øk antall"
        onClick={(event) => {
          event.stopPropagation();
          onChange(quantity + 1);
        }}
      >
        <Plus className="size-5" />
      </Button>
      <Button
        type="button"
        variant="destructive"
        className="w-full"
        aria-label="Fjern tjeneste"
        onClick={(event) => {
          event.stopPropagation();
          onChange(0);
        }}
      >
        <Trash2 className="size-5 sm:hidden" />
        <span className="hidden sm:inline">Fjern</span>
      </Button>
    </ButtonGroup>
  );
}
