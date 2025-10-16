export function formatDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function daysFromNow(date) {
  const target = date instanceof Date ? date : new Date(date);
  const day = 24 * 60 * 60 * 1000;
  const t0 = new Date(); 
  t0.setHours(0,0,0,0);
  const t1 = new Date(target); 
  t1.setHours(0,0,0,0);
  return Math.round((t1 - t0) / day);
}

export function isToday(date) { return daysFromNow(date) === 0; }
