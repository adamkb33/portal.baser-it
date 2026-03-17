import * as React from 'react';
import { Text } from '../atoms/text';
import { type KeyValueItem } from './key-value-list';
import { Stack } from '../layout/stack';

export interface StickySummaryBarProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  items: KeyValueItem[];
  primaryAction: React.ReactNode;
  secondaryAction?: React.ReactNode;
}

function toPreviewText(value: React.ReactNode) {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }

  return null;
}

export function StickySummaryBar({
  title,
  items,
  primaryAction,
  secondaryAction,
  className,
  ...props
}: StickySummaryBarProps) {
  const { style, ...restProps } = props;

  const previewItems = items
    .map((item) => {
      const value = toPreviewText(item.value);
      if (!value) return null;

      return `${item.label}: ${value}`;
    })
    .filter((item): item is string => Boolean(item))
    .slice(0, 2);

  const previewText = previewItems.join(' · ');

  return (
    <div className={className} style={style} {...restProps}>
      <Stack space="sm">
        {title || previewText ? (
          <div className="min-w-0">
            {title ? (
              <Text as="p" variant="overline" className="text-text-secondary">
                {title}
              </Text>
            ) : null}
            {previewText ? (
              <Text as="p" variant="body-sm" className="truncate font-medium text-text-primary">
                {previewText}
              </Text>
            ) : null}
          </div>
        ) : null}

        <Stack space="xs">
          <div>{primaryAction}</div>
          {secondaryAction ? <div>{secondaryAction}</div> : null}
        </Stack>
      </Stack>
    </div>
  );
}
