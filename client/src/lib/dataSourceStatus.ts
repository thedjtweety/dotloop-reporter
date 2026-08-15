export interface DataSourceStatusInput {
  hasData: boolean;
  isDemoMode: boolean;
  activeDataSetName?: string;
}

export function getDataSourceStatus({
  hasData,
  isDemoMode,
  activeDataSetName,
}: DataSourceStatusInput) {
  if (!hasData) return null;

  if (isDemoMode) {
    return {
      label: 'Demo data active',
      title: 'Demo data is active',
      tone: 'demo' as const,
    };
  }

  const fileName = activeDataSetName?.trim() || 'Uploaded file';
  return {
    label: `CSV loaded: ${fileName}`,
    title: `Uploaded CSV is active: ${fileName}`,
    tone: 'upload' as const,
  };
}
