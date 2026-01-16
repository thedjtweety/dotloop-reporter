import { startOfDay, endOfDay, isWithinInterval, subDays, differenceInDays, parseISO } from 'date-fns';
import { DotloopRecord } from './csvParser';

export interface DateRange {
  from: Date;
  to: Date;
}

export const filterRecordsByDate = (records: DotloopRecord[], range: DateRange): DotloopRecord[] => {
  return records.filter(record => {
    if (!record.contractAgreementDate && !record.closingDate && !record.creationDate) return false;
    
    // Prioritize Closing Date, then Contract Date, then Creation Date
    const dateStr = record.closingDate || record.contractAgreementDate || record.creationDate;
    if (!dateStr) return false;
    
    const date = new Date(dateStr);
    return isWithinInterval(date, { start: startOfDay(range.from), end: endOfDay(range.to) });
  });
};

export const getPreviousPeriod = (range: DateRange): DateRange => {
  const duration = differenceInDays(range.to, range.from) + 1;
  return {
    from: subDays(range.from, duration),
    to: subDays(range.to, duration)
  };
};

export const calculateTrend = (current: number, previous: number): { value: number; direction: 'up' | 'down' | 'neutral' } => {
  if (previous === 0) return { value: 0, direction: 'neutral' };
  const change = ((current - previous) / previous) * 100;
  return {
    value: Math.abs(Math.round(change)),
    direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
  };
};
