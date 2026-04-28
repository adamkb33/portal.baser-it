import { Card, CardContent, CardDescription, CardHeader, CardTitle, type CardVariant } from './card';

export type NoticeTone = 'default' | 'emphasis' | 'muted';

export interface NoticeProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  message: React.ReactNode;
  tone?: NoticeTone;
  action?: React.ReactNode;
}

const toneClasses: Record<NoticeTone, CardVariant> = {
  default: 'subtle',
  emphasis: 'emphasis',
  muted: 'subtle',
};

export function Notice({ title, message, tone = 'default', action, className, ...props }: NoticeProps) {
  return (
    <Card variant={toneClasses[tone]} size="sm" className={className} {...props}>
      {title ? (
        <CardHeader>
          <CardTitle as="h4">{title}</CardTitle>
        </CardHeader>
      ) : null}
      <CardContent>
        <CardDescription>{message}</CardDescription>
        {action ? <div className="pt-2">{action}</div> : null}
      </CardContent>
    </Card>
  );
}
