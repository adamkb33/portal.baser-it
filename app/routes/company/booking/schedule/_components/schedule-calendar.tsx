import FullCalendar from '@fullcalendar/react';
import type {
  BusinessHoursInput,
  DateSelectArg,
  DatesSetArg,
  EventClickArg,
  EventContentArg,
  EventInput,
} from '@fullcalendar/core';
import nbLocale from '@fullcalendar/core/locales/nb';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import { formatInTimeZone } from 'date-fns-tz';
import { DEFAULT_QUERY_TIMEZONE } from '~/lib/query';

type ScheduleCalendarProps = {
  date: string;
  events: EventInput[];
  businessHours: BusinessHoursInput;
  slotMinTime: string;
  slotMaxTime: string;
  scrollTime: string;
  validRangeStart: string;
  isMobileLayout: boolean;
  mobileDayKey: string | null;
  onVisibleDateChange: (date: string) => void;
  onEventClick: (event: EventClickArg) => void;
  onRangeSelect: (selection: DateSelectArg) => void;
};

export function ScheduleCalendar({
  date,
  events,
  businessHours,
  slotMinTime,
  slotMaxTime,
  scrollTime,
  validRangeStart,
  isMobileLayout,
  mobileDayKey,
  onVisibleDateChange,
  onEventClick,
  onRangeSelect,
}: ScheduleCalendarProps) {
  const initialView = isMobileLayout ? 'timeGridDay' : 'timeGridWeek';
  const initialDate = isMobileLayout && mobileDayKey ? mobileDayKey : date;

  const handleDatesSet = (dateInfo: DatesSetArg) => {
    if (isMobileLayout) {
      return;
    }

    onVisibleDateChange(formatInTimeZone(dateInfo.start, DEFAULT_QUERY_TIMEZONE, 'yyyy-MM-dd'));
  };

  const renderEventContent = (eventContent: EventContentArg) => {
    return (
      <div className="schedule-event-content">
        <span className="schedule-event-time">{eventContent.timeText}</span>
        <span className="schedule-event-title">{eventContent.event.title}</span>
      </div>
    );
  };

  return (
    <div className="schedule-calendar">
      <FullCalendar
        key={`${initialView}-${initialDate}-${slotMinTime}-${slotMaxTime}`}
        plugins={[timeGridPlugin, interactionPlugin]}
        initialView={initialView}
        initialDate={initialDate}
        firstDay={1}
        locale={nbLocale}
        timeZone={DEFAULT_QUERY_TIMEZONE}
        headerToolbar={false}
        allDaySlot={false}
        nowIndicator
        selectable
        selectMirror
        editable={false}
        slotDuration="00:30"
        snapDuration="00:05"
        slotMinTime={slotMinTime}
        slotMaxTime={slotMaxTime}
        scrollTime={scrollTime}
        validRange={{ start: validRangeStart }}
        businessHours={businessHours}
        events={events}
        datesSet={handleDatesSet}
        eventClick={onEventClick}
        select={onRangeSelect}
        selectAllow={(selection) => selection.start.getTime() >= Date.now()}
        eventContent={renderEventContent}
        height="auto"
        expandRows
        longPressDelay={200}
        selectLongPressDelay={200}
      />
    </div>
  );
}
