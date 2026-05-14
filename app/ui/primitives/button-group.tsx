import { cn } from '../lib/cn';

export interface ButtonGroupProps extends React.ComponentProps<'div'> {
  orientation?: 'horizontal' | 'vertical';
}

export function ButtonGroup({ className, orientation = 'horizontal', ...props }: ButtonGroupProps) {
  return (
    <div
      role="group"
      data-slot="button-group"
      data-orientation={orientation}
      className={cn(
        'inline-flex w-fit items-stretch isolate [&>*]:focus-visible:relative [&>*]:focus-visible:z-10',
        orientation === 'horizontal' &&
          '[&>*:not(:first-child)]:rounded-l-none [&>*:not(:first-child)]:-ml-px [&>*:not(:last-child)]:rounded-r-none',
        orientation === 'vertical' &&
          'flex-col [&>*:not(:first-child)]:rounded-t-none [&>*:not(:first-child)]:-mt-px [&>*:not(:last-child)]:rounded-b-none',
        className,
      )}
      {...props}
    />
  );
}
