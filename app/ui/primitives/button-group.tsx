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
        'isolate inline-flex w-fit items-stretch [&>*]:relative [&>*]:focus-visible:z-20 [&>*]:hover:z-10',
        orientation === 'horizontal' && [
          '[&>*:not(:first-child)]:-ml-px',
          '[&>*:not(:first-child)]:rounded-l-none',
          '[&>*:not(:last-child)]:rounded-r-none',
          '[&>*:not(:first-child):not(:last-child)]:rounded-none',
        ],
        orientation === 'vertical' && [
          'flex-col',
          '[&>*:not(:first-child)]:-mt-px',
          '[&>*:not(:first-child)]:rounded-t-none',
          '[&>*:not(:last-child)]:rounded-b-none',
          '[&>*:not(:first-child):not(:last-child)]:rounded-none',
        ],
        className,
      )}
      {...props}
    />
  );
}
