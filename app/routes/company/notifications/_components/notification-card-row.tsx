import type { ReactNode } from 'react';
import { CalendarClock, Clock3, Eye, MessageSquareQuote } from 'lucide-react';
import { Link } from 'react-router';
import type { InAppNotificationDto } from '~/api/generated/notification';
import { Badge, Card, CardContent } from '~/ui';
import { cn } from '~/ui/lib/cn';
import { compactText, formatNotificationTimestamp } from '../_utils/format';
import { getNotificationHeadline } from '../_utils/query';

type NotificationCardRowProps = {
  notification: InAppNotificationDto;
  isViewed: boolean;
  appointmentHref: string | null;
  onOpen: (notification: InAppNotificationDto) => void;
};

export function NotificationCardRow({ notification, isViewed, appointmentHref, onOpen }: NotificationCardRowProps) {
  return (
    <Card
      size="sm"
      className={cn(
        'cursor-pointer shadow-sm transition-shadow hover:shadow-md',
        isViewed ? 'border-l-4 border-l-slate-300' : 'border-l-4 border-l-interactive',
      )}
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
      <CardContent className="space-y-3 p-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-text-primary">{getNotificationHeadline(notification)}</p>
              {!isViewed && (
                <Badge variant="primary" size="sm">
                  Ny
                </Badge>
              )}
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
            <p className="text-xs text-text-secondary">
              Opprettet {formatNotificationTimestamp(notification.createdAt)}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Badge variant={isViewed ? 'outline' : 'primary'} size="sm">
              {isViewed ? 'Lest' : 'Ulest'}
            </Badge>
          </div>
        </div>

        <div className="flex items-start gap-2 text-sm leading-snug text-text-secondary">
          <MessageSquareQuote className="mt-0.5 h-4 w-4 shrink-0 text-text-disabled" />
          <p className="line-clamp-2">{compactText(notification.content)}</p>
        </div>

        <div className="grid grid-cols-1 gap-2 border-t border-border pt-3 sm:grid-cols-2">
          <InfoRow
            icon={<Clock3 className="h-3.5 w-3.5 text-text-disabled" />}
            label="Oppdatert"
            value={formatNotificationTimestamp(notification.updatedAt ?? notification.createdAt)}
          />
          <InfoRow
            icon={<Eye className="h-3.5 w-3.5 text-text-disabled" />}
            label="Lest"
            value={notification.readAt ? formatNotificationTimestamp(notification.readAt) : 'Ikke lest ennå'}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      {icon}
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-text-secondary">{label}</p>
        <p className="break-words text-xs font-medium text-text-primary">{value}</p>
      </div>
    </div>
  );
}
