import { CalendarClock, Clock3, MessageSquareQuote } from 'lucide-react';
import { Link } from 'react-router';
import type { InAppNotificationDto } from '~/api/generated/notification';
import { compactText, formatNotificationTimestamp } from '../_utils/format';
import { getNotificationHeadline } from '../_utils/query';
import { Badge, TableCell, TableRow } from '~/ui';

type NotificationTableRowProps = {
  notification: InAppNotificationDto;
  isViewed: boolean;
  appointmentHref: string | null;
  onOpen: (notification: InAppNotificationDto) => void;
};

export function NotificationTableRow({ notification, isViewed, appointmentHref, onOpen }: NotificationTableRowProps) {
  return (
    <TableRow
      className={
        isViewed ? 'cursor-pointer opacity-80 hover:bg-surface-variant-1' : 'cursor-pointer hover:bg-blue-50/50'
      }
      onClick={() => onOpen(notification)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen(notification);
        }
      }}
    >
      <TableCell className="space-y-1 py-2 align-top">
        <p className="text-sm font-semibold text-text-primary">{formatNotificationTimestamp(notification.createdAt)}</p>
        <p className="text-xs text-text-secondary">
          Oppdatert: {formatNotificationTimestamp(notification.updatedAt ?? notification.createdAt)}
        </p>
      </TableCell>

      <TableCell className="py-2 align-top">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-text-primary">{getNotificationHeadline(notification)}</p>
            {!isViewed && <span className="inline-flex h-2.5 w-2.5 rounded-full bg-primary" aria-hidden="true" />}
            {appointmentHref ? (
              <Link
                to={appointmentHref}
                className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10.5px] font-semibold leading-none text-interactive transition-colors hover:bg-blue-50/80 hover:text-interactive-hover"
                onClick={(event) => event.stopPropagation()}
              >
                <CalendarClock className="h-3 w-3" />
                Timebestilling
              </Link>
            ) : null}
          </div>
          <div className="flex items-start gap-2 text-xs text-text-secondary">
            <MessageSquareQuote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-disabled" />
            <p className="line-clamp-1">{compactText(notification.content)}</p>
          </div>
        </div>
      </TableCell>
      <TableCell className="py-2 align-top">
        <div className="space-y-1.5">
          <Badge variant={isViewed ? 'outline' : 'primary'} size="sm">
            {isViewed ? 'Lest' : 'Ulest'}
          </Badge>
          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
            <Clock3 className="h-3.5 w-3.5" />
            <span>
              Lest: {notification.readAt ? formatNotificationTimestamp(notification.readAt) : 'Ikke lest ennå'}
            </span>
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}
