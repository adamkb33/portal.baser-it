import { formatInTimeZone } from 'date-fns-tz';
import { DEFAULT_QUERY_TIMEZONE } from '~/lib/query';

export function getDateKeyInZone(dateTime: string, timezone = DEFAULT_QUERY_TIMEZONE): string {
  return formatInTimeZone(new Date(dateTime), timezone, 'yyyy-MM-dd');
}
