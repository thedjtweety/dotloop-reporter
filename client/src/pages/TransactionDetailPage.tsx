/**
 * Transaction Detail Page
 * Shows all available fields for a single DotloopRecord transaction.
 * Accessed by clicking a transaction row in the Agent Drill-Down modal.
 */

import { useLocation, useRoute } from 'wouter';
import { ArrowLeft, ExternalLink, ClipboardList, Home, DollarSign, Users, Calendar, Tag, FileText, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useTransactionData } from '@/contexts/TransactionDataContext';
import { useCDAPanel } from '@/contexts/CDAContext';
import { formatCurrency } from '@/lib/formatUtils';
import { DotloopRecord } from '@/lib/csvParser';

// ─── helpers ────────────────────────────────────────────────────────────────

function fmt(val: any): string {
  if (val === undefined || val === null || val === '') return '—';
  if (typeof val === 'number') return val === 0 ? '—' : String(val);
  if (Array.isArray(val)) return val.length ? val.join(', ') : '—';
  return String(val);
}

function fmtMoney(val: any): string {
  if (!val || Number(val) === 0) return '—';
  return formatCurrency(Number(val));
}

function fmtPct(val: any): string {
  if (!val || Number(val) === 0) return '—';
  return `${Number(val).toFixed(2)}%`;
}

function StatusBadge({ status }: { status: string }) {
  const lower = (status || '').toLowerCase();
  const cls = lower.includes('closed') || lower.includes('sold')
    ? 'bg-green-500/15 text-green-400 border-green-500/30'
    : lower.includes('active')
    ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
    : lower.includes('contract') || lower.includes('pending')
    ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
    : lower.includes('archived')
    ? 'bg-muted text-foreground/60 border-border'
    : 'bg-muted text-foreground/60 border-border';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {status || '—'}
    </span>
  );
}

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
        <Icon className="w-4 h-4 text-primary" />
        <h2 className="font-semibold text-foreground">{title}</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
        {children}
      </div>
    </Card>
  );
}

function Field({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs text-foreground/60 mb-0.5">{label}</p>
      <p className={`text-sm font-medium ${highlight ? 'text-primary' : 'text-foreground'} break-words`}>{value}</p>
    </div>
  );
}

// ─── page ────────────────────────────────────────────────────────────────────

interface TransactionDetailPageProps {
  params?: { id?: string; index?: string };
}

export default function TransactionDetailPage({ params }: TransactionDetailPageProps) {
  const [, setLocation] = useLocation();
  const [, routeParams] = useRoute('/transaction/:index');
  const { allRecords } = useTransactionData();
  const { openCDA } = useCDAPanel();

  // Support the current /transaction/:id route plus the legacy index alias.
  const rawKey = decodeURIComponent(params?.id ?? params?.index ?? routeParams?.index ?? '');

  // First try to match by loopId
  let record: DotloopRecord | undefined = allRecords.find(r => r.loopId && r.loopId === rawKey);

  // Fall back to composite key match: loopName|closingDate|salePrice
  if (!record && rawKey.includes('|')) {
    const [loopName, closingDate, salePrice] = rawKey.split('|');
    record = allRecords.find(r =>
      (r.loopName || '') === loopName &&
      (r.closingDate || '') === closingDate &&
      String(r.salePrice ?? r.price ?? '') === salePrice
    );
  }

  if (!record) {
    return (
      <div className="p-8 text-center">
        <Info className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Transaction Not Found</h2>
        <p className="text-foreground/60 mb-6">This transaction no longer exists in the current dataset.</p>
        <Button onClick={() => setLocation('/agents')}>Back to Agents</Button>
      </div>
    );
  }

  const displayAddress = record.address || record.loopName || 'Transaction';

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            className="text-foreground/60 hover:text-foreground -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">{displayAddress}</h1>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={record.loopStatus} />
              {record.loopId && (
                <span className="text-xs text-foreground/50">Loop #{record.loopId}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {record.loopViewUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(record.loopViewUrl, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-1" /> Open in Dotloop
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => openCDA(record, displayAddress)}
            className="bg-primary hover:bg-primary/90"
          >
            <ClipboardList className="w-4 h-4 mr-1" /> Open CDA Builder
          </Button>
        </div>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Sale Price', value: fmtMoney(record.salePrice || record.price), color: 'text-blue-400' },
          { label: 'Commission', value: fmtMoney(record.commissionTotal), color: 'text-green-400' },
          { label: 'Commission Rate', value: fmtPct(record.commissionRate), color: 'text-green-400' },
          { label: 'Closing Date', value: fmt(record.closingDate), color: 'text-foreground' },
        ].map(m => (
          <Card key={m.label} className="p-4">
            <p className="text-xs text-foreground/60 mb-1">{m.label}</p>
            <p className={`text-lg font-bold ${m.color}`}>{m.value}</p>
          </Card>
        ))}
      </div>

      {/* Property Details */}
      <Section icon={Home} title="Property Details">
        <Field label="Loop Name" value={fmt(record.loopName)} />
        <Field label="Address" value={fmt(record.address)} />
        <Field label="City" value={fmt(record.city)} />
        <Field label="State" value={fmt(record.state)} />
        <Field label="County" value={fmt(record.county)} />
        <Field label="Property Type" value={fmt(record.propertyType)} />
        <Field label="Bedrooms" value={fmt(record.bedrooms)} />
        <Field label="Bathrooms" value={fmt(record.bathrooms)} />
        <Field label="Sq. Footage" value={record.squareFootage ? `${Number(record.squareFootage).toLocaleString()} sq ft` : '—'} />
        <Field label="Year Built" value={fmt(record.yearBuilt)} />
        <Field label="Lot Size" value={record.lotSize ? `${Number(record.lotSize).toLocaleString()} sq ft` : '—'} />
        <Field label="Subdivision" value={fmt(record.subdivision)} />
      </Section>

      {/* Transaction Dates */}
      <Section icon={Calendar} title="Key Dates">
        <Field label="Loop Status" value={fmt(record.loopStatus)} />
        <Field label="Created Date" value={fmt(record.createdDate)} />
        <Field label="Listing Date" value={fmt(record.listingDate)} />
        <Field label="Offer Date" value={fmt(record.offerDate)} />
        <Field label="Closing Date" value={fmt(record.closingDate)} />
        <Field label="Original Price" value={fmtMoney(record.originalPrice)} />
        <Field label="List Price" value={fmtMoney(record.price)} />
        <Field label="Sale Price" value={fmtMoney(record.salePrice)} highlight />
      </Section>

      {/* Commission & Financial */}
      <Section icon={DollarSign} title="Commission & Financial">
        <Field label="Commission Rate" value={fmtPct(record.commissionRate)} highlight />
        <Field label="Total Commission" value={fmtMoney(record.commissionTotal)} highlight />
        <Field label="Buy-Side Commission" value={fmtMoney(record.buySideCommission)} />
        <Field label="Sell-Side Commission" value={fmtMoney(record.sellSideCommission)} />
        <Field label="Company Dollar" value={fmtMoney(record.companyDollar)} />
        <Field label="Earnest Money" value={fmtMoney(record.earnestMoney)} />
        <Field label="Referral Source" value={fmt(record.referralSource)} />
        <Field label="Referral %" value={fmtPct(record.referralPercentage)} />
      </Section>

      {/* People */}
      <Section icon={Users} title="People">
        <Field label="Agents" value={fmt(record.agents)} />
        <Field label="Created By" value={fmt(record.createdBy)} />
        <Field label="Lead Source" value={fmt(record.leadSource)} />
        <Field label="Buyer Name" value={fmt(record.buyerName)} />
        <Field label="Buyer Email" value={fmt(record.buyerEmail)} />
        <Field label="Buyer Phone" value={fmt(record.buyerPhone)} />
        <Field label="Seller Name" value={fmt(record.sellerName)} />
        <Field label="Seller Email" value={fmt(record.sellerEmail)} />
        <Field label="Seller Phone" value={fmt(record.sellerPhone)} />
      </Section>

      {/* Compliance & Tags */}
      <Section icon={FileText} title="Compliance & Tags">
        <Field label="Compliance Status" value={fmt(record.complianceStatus)} />
        <div className="col-span-2 sm:col-span-3 lg:col-span-4">
          <p className="text-xs text-foreground/60 mb-1.5">Tags</p>
          {record.tags && record.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {record.tags.map((tag, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  <Tag className="w-3 h-3 mr-1" />{tag}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-foreground/40">No tags</p>
          )}
        </div>
      </Section>

      {/* Raw extra fields (any unmapped keys) */}
      {(() => {
        const knownKeys = new Set([
          'loopId','loopViewUrl','loopName','loopStatus','createdDate','closingDate','listingDate',
          'offerDate','address','price','propertyType','bedrooms','bathrooms','squareFootage','city',
          'state','county','leadSource','earnestMoney','salePrice','commissionRate','commissionTotal',
          'agents','createdBy','buySideCommission','sellSideCommission','companyDollar','referralSource',
          'referralPercentage','complianceStatus','tags','originalPrice','yearBuilt','lotSize','subdivision',
          'buyerName','buyerEmail','buyerPhone','sellerName','sellerEmail','sellerPhone',
        ]);
        const extra = Object.entries(record).filter(([k, v]) =>
          !knownKeys.has(k) && v !== undefined && v !== null && v !== '' && v !== 0
        );
        if (extra.length === 0) return null;
        return (
          <Section icon={Info} title="Additional Fields">
            {extra.map(([k, v]) => (
              <Field key={k} label={k} value={Array.isArray(v) ? v.join(', ') : String(v)} />
            ))}
          </Section>
        );
      })()}
    </div>
  );
}
