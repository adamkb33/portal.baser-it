import { Text } from '../atoms/text';
import { cn } from '../lib/cn';

export type FieldMessageTone = 'default' | 'muted';

export interface FieldMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {
  tone?: FieldMessageTone;
  children: React.ReactNode;
}

const toneClasses: Record<FieldMessageTone, string> = {
  default: 'text-text-primary',
  muted: 'text-text-secondary',
};

export function FieldMessage({ tone = 'muted', className, children, ...props }: FieldMessageProps) {
  return (
    <Text as="p" variant="caption" className={cn(toneClasses[tone], className)} {...props}>
      {children}
    </Text>
  );
}
