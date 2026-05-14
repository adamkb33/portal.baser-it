import type { MutableRefObject } from 'react';
import { Button } from '~/ui';
import { currentMinuteInTimeZone, formatMinuteClock, minuteFromPointer, minuteLabel, parseHourMinute, snapMinute } from '../_utils/schedule-time.utils';
import type { PositionedItem, ScheduleItem, ScheduleWeekDay, SelectionDraft, WorkWindow } from '../_types/schedule.types';
import { itemTone } from '../_utils/schedule-layout.utils';

type Props = {
  globalWindow: WorkWindow;
  visibleDays: ScheduleWeekDay[];
  isMobileLayout: boolean;
  itemsByDay: Map<string, PositionedItem[]>;
  hourRows: Array<{ start: number; end: number; top: number; height: number }>;
  calendarBodyHeightPx: number;
  isSelecting: boolean;
  activePointerId: number | null;
  selectionDraft: SelectionDraft | null;
  selectionCommitted: SelectionDraft | null;
  hoverState: { dayKey: string; minute: number } | null;
  dailySchedules: Array<{ dayOfWeek: string; startTime: string; endTime: string }>;
  scrollContainerRef: MutableRefObject<HTMLDivElement | null>;
  dayColumnRefs: MutableRefObject<Record<string, HTMLDivElement | null>>;
  setHoverState: (value: { dayKey: string; minute: number } | null | ((prev: { dayKey: string; minute: number } | null) => { dayKey: string; minute: number } | null)) => void;
  setActivePointerId: (value: number | null) => void;
  beginSelection: (dayKey: string, dayOfWeek: SelectionDraft['dayOfWeek'], minute: number) => void;
  updateSelection: (dayKey: string, minute: number) => void;
  commitSelection: () => void;
  getSelectionBounds: (selection: SelectionDraft) => { startMinute: number; endMinute: number };
  onItemClick: (itemId: string) => void;
};

export function ScheduleDesktopView({
  globalWindow,
  visibleDays,
  isMobileLayout,
  itemsByDay,
  hourRows,
  calendarBodyHeightPx,
  isSelecting,
  activePointerId,
  selectionDraft,
  selectionCommitted,
  hoverState,
  dailySchedules,
  scrollContainerRef,
  dayColumnRefs,
  setHoverState,
  setActivePointerId,
  beginSelection,
  updateSelection,
  commitSelection,
  getSelectionBounds,
  onItemClick,
}: Props) {
  const timeColumnWidth = isMobileLayout ? 44 : 50;
  const gridTemplateColumns = `${timeColumnWidth}px repeat(${Math.max(1, visibleDays.length)}, minmax(0, 1fr))`;

  return (
    <div
      ref={scrollContainerRef}
      className="relative h-[clamp(26.25rem,calc(100dvh-12rem),33rem)] overflow-auto overscroll-contain rounded-2xl border border-border bg-background shadow-sm"
    >
      <div className="grid w-full overflow-hidden rounded-2xl" style={{ gridTemplateColumns }}>
        <div className="sticky top-0 z-20 border-r border-border bg-surface" />
        {visibleDays.map((day) => (
          <div
            key={`head-${day.key}`}
            className={`sticky top-0 z-20 border-r border-border px-2 py-2.5 text-center text-xs font-semibold uppercase tracking-wide shadow-sm backdrop-blur-sm last:border-r-0 ${
              day.isToday
                ? 'bg-surface-primary-subtle/95 text-primary'
                : day.isPast
                  ? 'bg-surface-variant-2/95 text-text-secondary'
                  : 'bg-surface/95 text-text-primary'
            }`}
          >
            {day.label}
          </div>
        ))}

        <div className="relative border-r border-border bg-surface">
          {hourRows.map((row) => (
            <div
              key={`label-row-${row.start}`}
              className="absolute left-0 right-0 border-t border-border/60 px-1 text-xs text-text-secondary"
              style={{ top: `${row.top}%`, height: `${row.height}%` }}
            >
              {minuteLabel(row.start)}
            </div>
          ))}
          <div className="absolute bottom-0 left-0 right-0 border-t border-border/60 px-1 text-xs text-text-secondary">
            {minuteLabel(globalWindow.endMinute)}
          </div>
          <div className="absolute bottom-0 left-0 right-0 border-t border-border/60" />
        </div>

        {visibleDays.map((day) => {
          const dayItems = itemsByDay.get(day.key) ?? [];
          const activeSelection =
            selectionDraft && selectionDraft.dayKey === day.key
              ? selectionDraft
              : selectionCommitted && selectionCommitted.dayKey === day.key
                ? selectionCommitted
                : null;
          const activeBounds = activeSelection ? getSelectionBounds(activeSelection) : null;
          const total = Math.max(1, globalWindow.endMinute - globalWindow.startMinute);
          const selectionTop = activeBounds ? ((activeBounds.startMinute - globalWindow.startMinute) / total) * 100 : 0;
          const selectionHeight = activeBounds
            ? Math.max(1.2, ((activeBounds.endMinute - activeBounds.startMinute) / total) * 100)
            : 0;
          const nowMinute = currentMinuteInTimeZone();
          const dayWorkWindows = dailySchedules
            .filter((schedule) => schedule.dayOfWeek === day.dayOfWeek)
            .map((schedule) => {
              const start = parseHourMinute(schedule.startTime);
              const end = parseHourMinute(schedule.endTime);
              if (!start || !end) return null;
              const startMinute = Math.max(globalWindow.startMinute, start.hour * 60 + start.minute);
              const endMinute = Math.min(globalWindow.endMinute, end.hour * 60 + end.minute);
              if (endMinute <= startMinute) return null;
              return { startMinute, endMinute };
            })
            .filter((window): window is { startMinute: number; endMinute: number } => window !== null);
          const dayLastWorkMinute = dayWorkWindows.length > 0 ? Math.max(...dayWorkWindows.map((window) => window.endMinute)) : null;
          const isCompletedWorkDay = day.isPast || (day.isToday && dayLastWorkMinute != null && nowMinute >= dayLastWorkMinute);
          const workWindowToneClass = isCompletedWorkDay ? 'bg-surface-variant-2/55' : 'bg-surface-secondary-subtle/55';
          const minSelectableMinute = day.isPast
            ? globalWindow.endMinute
            : day.isToday
              ? Math.max(globalWindow.startMinute, snapMinute(nowMinute))
              : globalWindow.startMinute;
          const pastOverlayHeight = day.isPast
            ? 100
            : day.isToday
              ? ((Math.max(globalWindow.startMinute, Math.min(globalWindow.endMinute, minSelectableMinute)) - globalWindow.startMinute) /
                  Math.max(1, globalWindow.endMinute - globalWindow.startMinute)) *
                100
              : 0;

          return (
            <div
              key={`col-${day.key}`}
              ref={(element) => {
                dayColumnRefs.current[day.key] = element;
              }}
              className="relative border-r border-border bg-background last:border-r-0"
              style={{ height: `${calendarBodyHeightPx}px`, touchAction: isSelecting ? 'none' : 'pan-y' }}
              onPointerLeave={() => {
                setHoverState((prev) => (prev?.dayKey === day.key ? null : prev));
                if (isSelecting && activePointerId !== null) commitSelection();
              }}
              onPointerMove={(event) => {
                if (day.isPast) return;
                if (activePointerId !== null && event.pointerId !== activePointerId) return;
                const rect = event.currentTarget.getBoundingClientRect();
                const rawMinute = minuteFromPointer(event.clientY, rect, globalWindow.startMinute, globalWindow.endMinute);
                const minute = Math.max(minSelectableMinute, rawMinute);
                if (minute >= globalWindow.endMinute) return;
                setHoverState({ dayKey: day.key, minute });
                if (isSelecting) updateSelection(day.key, minute);
              }}
              onPointerDown={(event) => {
                if (day.isPast) return;
                if ((event.target as HTMLElement).closest('[data-schedule-item="true"]')) return;
                setActivePointerId(event.pointerId);
                event.currentTarget.setPointerCapture(event.pointerId);
                const rect = event.currentTarget.getBoundingClientRect();
                const rawMinute = minuteFromPointer(event.clientY, rect, globalWindow.startMinute, globalWindow.endMinute);
                const minute = Math.max(minSelectableMinute, rawMinute);
                if (minute >= globalWindow.endMinute) return;
                beginSelection(day.key, day.dayOfWeek, minute);
              }}
              onPointerUp={(event) => {
                if (day.isPast) return;
                const rect = event.currentTarget.getBoundingClientRect();
                const rawMinute = minuteFromPointer(event.clientY, rect, globalWindow.startMinute, globalWindow.endMinute);
                const minute = Math.max(minSelectableMinute, rawMinute);
                if (minute >= globalWindow.endMinute) return;

                if (activePointerId !== null && event.pointerId !== activePointerId) return;
                if ((event.target as HTMLElement).closest('[data-schedule-item="true"]')) return;
                if (isSelecting) {
                  commitSelection();
                  setActivePointerId(null);
                }
              }}
              onPointerCancel={(event) => {
                if (activePointerId !== null && event.pointerId !== activePointerId) return;
                if (isSelecting) commitSelection();
                setActivePointerId(null);
              }}
            >
              {pastOverlayHeight > 0 ? (
                <div className="pointer-events-none absolute inset-x-0 top-0 bg-black/5" style={{ height: `${pastOverlayHeight}%` }} />
              ) : null}
              {hourRows.map((row) => (
                <div
                  key={`line-${day.key}-${row.start}`}
                  className="absolute left-0 right-0 border-t border-border/60"
                  style={{ top: `${row.top}%` }}
                />
              ))}
              {dayWorkWindows.map((window, index) => {
                const top = ((window.startMinute - globalWindow.startMinute) / total) * 100;
                const height = ((window.endMinute - window.startMinute) / total) * 100;
                return (
                  <div
                    key={`work-window-${day.key}-${index}`}
                    className={`pointer-events-none absolute left-0 right-0 ${workWindowToneClass}`}
                    style={{ top: `${top}%`, height: `${height}%` }}
                  />
                );
              })}
              <div className="absolute bottom-0 left-0 right-0 border-t border-border/60" />
              {activeBounds ? (
                <div
                  className="absolute left-0 right-0 rounded-sm bg-primary/20 ring-1 ring-primary/40"
                  style={{ top: `${selectionTop}%`, height: `${selectionHeight}%` }}
                >
                  <div className="pointer-events-none absolute inset-x-1 top-1 rounded-sm bg-primary px-1 py-0.5 text-xs font-semibold leading-none text-white shadow-sm">
                    {formatMinuteClock(activeBounds.startMinute)} - {formatMinuteClock(activeBounds.endMinute)}
                  </div>
                </div>
              ) : null}
              {hoverState?.dayKey === day.key ? (
                <div
                  className="pointer-events-none absolute left-0 right-0 border-t border-primary/50"
                  style={{
                    top: `${((hoverState.minute - globalWindow.startMinute) / Math.max(1, globalWindow.endMinute - globalWindow.startMinute)) * 100}%`,
                  }}
                />
              ) : null}

              {dayItems.map((item) => {
                const widthPct = 100 / item.laneCount;
                const leftPct = item.lane * widthPct;

                return (
                  <button
                    key={item.id}
                    data-schedule-item="true"
                    type="button"
                    onClick={() => onItemClick(item.id)}
                    className={`absolute overflow-hidden rounded-md border border-black/10 px-1.5 py-1 text-left text-xs font-medium leading-tight shadow-sm ${itemTone(item)}`}
                    style={{
                      top: `${item.top}%`,
                      height: `${item.height}%`,
                      minHeight: '20px',
                      left: `${leftPct}%`,
                      width: `${widthPct}%`,
                    }}
                  >
                    <div className="truncate">{item.text}</div>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
