import { describe, expect, it } from 'vitest';
import { getDataSourceStatus } from './dataSourceStatus';

describe('getDataSourceStatus', () => {
  it('does not show a source badge before data is loaded', () => {
    expect(getDataSourceStatus({ hasData: false, isDemoMode: false })).toBeNull();
  });

  it('labels sample records as demo data', () => {
    expect(getDataSourceStatus({ hasData: true, isDemoMode: true, activeDataSetName: 'sales.csv' }))
      .toMatchObject({ label: 'Demo data active', tone: 'demo' });
  });

  it('labels real uploads with the uploaded CSV filename', () => {
    expect(getDataSourceStatus({ hasData: true, isDemoMode: false, activeDataSetName: 'August closings.csv' }))
      .toMatchObject({ label: 'CSV loaded: August closings.csv', tone: 'upload' });
  });

  it('uses a safe fallback label when a legacy upload lacks a filename', () => {
    expect(getDataSourceStatus({ hasData: true, isDemoMode: false }))
      .toMatchObject({ label: 'CSV loaded: Uploaded file', tone: 'upload' });
  });
});
