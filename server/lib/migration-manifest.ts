export type MigrationManifestInputRow = {
  sourceTransactionId?: string | null;
  transactionName: string;
  propertyAddress?: string | null;
  primaryAgent?: string | null;
  closingDate?: string | null;
  sourceFolderReference?: string | null;
  expectedFileCount?: number | null;
  notes?: string | null;
};

export type ManifestIssue = {
  category:
    | 'missing_source_reference'
    | 'missing_required_metadata'
    | 'duplicate_transaction'
    | 'invalid_manifest_row';
  severity: 'warning' | 'blocking';
  message: string;
};

export type ValidatedManifestRow = MigrationManifestInputRow & {
  expectedFileCount: number;
  issues: ManifestIssue[];
  isReady: boolean;
};

function clean(value?: string | null) {
  return value?.trim() || '';
}

export function manifestRowIdentity(row: MigrationManifestInputRow) {
  const sourceId = clean(row.sourceTransactionId);
  if (sourceId) return `source:${sourceId.toLocaleLowerCase()}`;
  return [clean(row.transactionName), clean(row.propertyAddress), clean(row.closingDate)]
    .map((part) => part.toLocaleLowerCase())
    .join('|');
}

export function validateMigrationManifest(rows: MigrationManifestInputRow[]): ValidatedManifestRow[] {
  const seen = new Set<string>();

  return rows.map((row) => {
    const issues: ManifestIssue[] = [];
    const transactionName = clean(row.transactionName);
    const sourceFolderReference = clean(row.sourceFolderReference);
    const expectedFileCount = Number(row.expectedFileCount ?? 0);
    const identity = manifestRowIdentity(row);

    if (!transactionName) {
      issues.push({
        category: 'missing_required_metadata', severity: 'blocking',
        message: 'Transaction Name is required for a searchable Dotloop archive.',
      });
    }
    if (!sourceFolderReference) {
      issues.push({
        category: 'missing_source_reference', severity: 'blocking',
        message: 'SkySlope ZIP or staged Drive/Dropbox folder reference is required.',
      });
    }
    if (!Number.isInteger(expectedFileCount) || expectedFileCount < 1) {
      issues.push({
        category: 'invalid_manifest_row', severity: 'blocking',
        message: 'Expected File Count must be a whole number of at least 1.',
      });
    }
    if (clean(row.closingDate) && !/^\d{4}-\d{2}-\d{2}$/.test(clean(row.closingDate))) {
      issues.push({
        category: 'invalid_manifest_row', severity: 'blocking',
        message: 'Closing Date must use YYYY-MM-DD when supplied.',
      });
    }
    if (!clean(row.sourceTransactionId)) {
      issues.push({
        category: 'missing_required_metadata', severity: 'warning',
        message: 'SkySlope Transaction ID is not present; duplicate detection uses the transaction name, address, and closing date.',
      });
    }
    if (identity && seen.has(identity)) {
      issues.push({
        category: 'duplicate_transaction', severity: 'blocking',
        message: 'This transaction duplicates another row in the migration manifest.',
      });
    }
    seen.add(identity);

    return {
      ...row,
      transactionName,
      sourceFolderReference,
      expectedFileCount: Number.isInteger(expectedFileCount) && expectedFileCount > 0 ? expectedFileCount : 0,
      issues,
      isReady: !issues.some((issue) => issue.severity === 'blocking'),
    };
  });
}

export function calculateMigrationCloseout(rows: Array<{
  status: string;
  expectedFileCount: number;
  reconciledFileCount: number;
}>, openBlockingExceptions: number) {
  const included = rows.filter((row) => row.status !== 'excluded');
  const reconciled = included.filter((row) => row.status === 'reconciled').length;
  const fileMismatches = included.filter((row) => row.reconciledFileCount !== row.expectedFileCount).length;
  return {
    includedCount: included.length,
    reconciledCount: reconciled,
    fileMismatchCount: fileMismatches,
    openBlockingExceptions,
    isReadyToComplete: included.length > 0 && reconciled === included.length && fileMismatches === 0 && openBlockingExceptions === 0,
  };
}

export function determineFileCountReconciliation(expectedFileCount: number, reconciledFileCount: number, hasOpenMismatch: boolean) {
  const matches = expectedFileCount === reconciledFileCount;
  return {
    matches,
    mismatchAction: matches ? (hasOpenMismatch ? 'resolve' : 'none') : (hasOpenMismatch ? 'update' : 'create'),
  } as const;
}
