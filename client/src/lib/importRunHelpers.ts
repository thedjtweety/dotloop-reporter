import type { DotloopRecord } from './csvParser';

function toDateString(value: string | undefined) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

export function inferReportingPeriod(records: DotloopRecord[]) {
  const dates = records
    .map((record) => toDateString(record.closingDate || record.createdDate || record.listingDate))
    .filter((date): date is string => Boolean(date))
    .sort();

  if (!dates.length) {
    return { label: 'Current CSV import', periodStart: null, periodEnd: null };
  }
  const periodStart = dates[0];
  const periodEnd = dates[dates.length - 1];
  return {
    label: periodStart === periodEnd ? `Data for ${periodEnd}` : `${periodStart} to ${periodEnd}`,
    periodStart,
    periodEnd,
  };
}

export function fieldCompletenessMap(fields: Array<{ fieldName: string; completenessPercentage: number }>) {
  return Object.fromEntries(fields.map((field) => [field.fieldName, field.completenessPercentage]));
}

export function importFingerprint(records: DotloopRecord[]) {
  const anchors = [records[0], records[Math.floor(records.length / 2)], records[records.length - 1]]
    .filter(Boolean)
    .map((record) => [record.loopId, record.loopName, record.closingDate, record.salePrice, record.agents].join('|'))
    .join('||');
  const source = `${records.length}::${anchors}`;
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `csv-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}
