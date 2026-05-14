import { type ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle, cn } from '~/ui';

interface InfoCardProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function InfoCard({ title, children, className }: InfoCardProps) {
  return (
    <Card className={cn('rounded-md', className)}>
      <CardHeader>
        <CardTitle className="text-md">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
