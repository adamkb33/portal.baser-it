const DAYS_NO = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'];
const DAYS_SHORT_NO = ['Søn', 'Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør'];
const MONTHS_NO = [
  'januar',
  'februar',
  'mars',
  'april',
  'mai',
  'juni',
  'juli',
  'august',
  'september',
  'oktober',
  'november',
  'desember',
];
const MONTHS_SHORT_NO = ['jan', 'feb', 'mars', 'apr', 'mai', 'juni', 'juli', 'aug', 'sep', 'okt', 'nov', 'des'];

export function formatNorwegianDateTime(dateTimeString: string): {
  dayName: string;
  date: string;
  time: string;
  full: string;
  short: string;
} {
  const dateObj = new Date(dateTimeString);
  const dayName = DAYS_NO[dateObj.getDay()];
  const day = dateObj.getDate();
  const month = MONTHS_NO[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  const time = dateTimeString.split('T')[1]?.substring(0, 5) || '';

  return {
    dayName,
    date: `${day}. ${month} ${year}`,
    time: `kl. ${time}`,
    full: `${dayName} ${day}. ${month} ${year} kl. ${time}`,
    short: `${DAYS_SHORT_NO[dateObj.getDay()]} ${day}. ${MONTHS_SHORT_NO[dateObj.getMonth()]}, ${time}`,
  };
}
