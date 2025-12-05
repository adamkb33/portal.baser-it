const DAYS_NO = ['Søn', 'Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør'];
const MONTHS_NO = ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'des'];

export function formatCompactDate(dateString: string) {
  const date = new Date(dateString);
  const dayName = DAYS_NO[date.getDay()];
  const day = date.getDate();
  const month = MONTHS_NO[date.getMonth()];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);
  const diff = compareDate.getTime() - today.getTime();
  const daysDiff = diff / (1000 * 60 * 60 * 24);

  if (daysDiff === 0) return { day: 'I dag', date: String(day), month };
  if (daysDiff === 1) return { day: 'I morgen', date: String(day), month };
  return { day: dayName, date: String(day), month };
}

export function formatFullDate(dateString: string): string {
  const { day, date, month } = formatCompactDate(dateString);
  return `${day} ${date}. ${month}`;
}

export function formatTime(dateTimeString: string): string {
  return dateTimeString.split('T')[1]?.substring(0, 5) || '';
}
