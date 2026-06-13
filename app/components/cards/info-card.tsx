import { type ReactNode } from 'react';
import { Card, CardContent, CardHead, cn } from '~/ui';

interface InfoCardProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function InfoCard({ title, children, className }: InfoCardProps) {
  return (
    <Card className={cn('rounded-md', className)}>
      <CardHead heading={title} />
      <CardContent>{children}</CardContent>
    </Card>
  );
}
