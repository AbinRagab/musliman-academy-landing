const academyTimeZone = 'Africa/Cairo';

export function getAcademyTodayDate(timeZone = academyTimeZone, now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const value = (type: string) => parts.find((part) => part.type === type)?.value || '';

  return `${value('year')}-${value('month')}-${value('day')}`;
}

export function getNowIso() {
  return new Date().toISOString();
}
