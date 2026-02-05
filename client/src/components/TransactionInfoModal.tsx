import { X, ExternalLink, Calendar, DollarSign, Home, User, Tag, FileText } from 'lucide-react';
import { DotloopRecord } from '@/lib/csvParser';
import { formatCurrency } from '@/lib/formatUtils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TransactionInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: DotloopRecord | null;
}

export default function TransactionInfoModal({
  isOpen,
  onClose,
  transaction,
}: TransactionInfoModalProps) {
  if (!isOpen || !transaction) return null;

  const getStatusColor = (status: string) => {
    const lower = status.toLowerCase();
    if (lower.includes('closed') || lower.includes('sold')) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (lower.includes('contract') || lower.includes('pending')) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    if (lower.includes('active')) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-slate-900 rounded-lg shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex-shrink-0 flex items-start justify-between px-6 py-4 border-b border-slate-700">
          <div className="flex-1 pr-4">
            <h2 className="text-2xl font-display font-bold text-white mb-2">
              {transaction.loopName || transaction.address || 'Transaction Details'}
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={`${getStatusColor(transaction.loopStatus || 'Unknown')} border`}>
                {transaction.loopStatus || 'Unknown Status'}
              </Badge>
              {transaction.transactionType && (
                <Badge variant="outline" className="border-slate-600 text-slate-300">
                  {transaction.transactionType}
                </Badge>
              )}
              {transaction.propertyType && (
                <Badge variant="outline" className="border-slate-600 text-slate-300">
                  {transaction.propertyType}
                </Badge>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Property Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Home className="w-5 h-5 text-blue-400" />
                Property Information
              </h3>
              <div className="space-y-3 bg-slate-800/50 rounded-lg p-4">
                {transaction.address && (
                  <div>
                    <p className="text-sm text-slate-400">Address</p>
                    <p className="text-white font-medium">{transaction.address}</p>
                  </div>
                )}
                {transaction.city && (
                  <div>
                    <p className="text-sm text-slate-400">City</p>
                    <p className="text-white">{transaction.city}</p>
                  </div>
                )}
                {transaction.state && (
                  <div>
                    <p className="text-sm text-slate-400">State</p>
                    <p className="text-white">{transaction.state}</p>
                  </div>
                )}
                {transaction.zipCode && (
                  <div>
                    <p className="text-sm text-slate-400">Zip Code</p>
                    <p className="text-white">{transaction.zipCode}</p>
                  </div>
                )}
                {transaction.mlsNumber && (
                  <div>
                    <p className="text-sm text-slate-400">MLS Number</p>
                    <p className="text-white font-mono">{transaction.mlsNumber}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Financial Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-400" />
                Financial Details
              </h3>
              <div className="space-y-3 bg-slate-800/50 rounded-lg p-4">
                {(transaction.price || transaction.salePrice) && (
                  <div>
                    <p className="text-sm text-slate-400">Price</p>
                    <p className="text-white font-bold text-xl">
                      {formatCurrency(transaction.salePrice || transaction.price)}
                    </p>
                  </div>
                )}
                {transaction.commission && (
                  <div>
                    <p className="text-sm text-slate-400">Commission</p>
                    <p className="text-green-400 font-semibold text-lg">
                      {formatCurrency(transaction.commission)}
                    </p>
                  </div>
                )}
                {transaction.commissionPercentage && (
                  <div>
                    <p className="text-sm text-slate-400">Commission Rate</p>
                    <p className="text-white">{transaction.commissionPercentage}%</p>
                  </div>
                )}
                {transaction.agentSplit && (
                  <div>
                    <p className="text-sm text-slate-400">Agent Split</p>
                    <p className="text-white">{transaction.agentSplit}%</p>
                  </div>
                )}
              </div>
            </div>

            {/* Agent & Team Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-purple-400" />
                Agent & Team
              </h3>
              <div className="space-y-3 bg-slate-800/50 rounded-lg p-4">
                {transaction.agentName && (
                  <div>
                    <p className="text-sm text-slate-400">Agent</p>
                    <p className="text-white font-medium">{transaction.agentName}</p>
                  </div>
                )}
                {transaction.teamName && (
                  <div>
                    <p className="text-sm text-slate-400">Team</p>
                    <p className="text-white">{transaction.teamName}</p>
                  </div>
                )}
                {transaction.officeName && (
                  <div>
                    <p className="text-sm text-slate-400">Office</p>
                    <p className="text-white">{transaction.officeName}</p>
                  </div>
                )}
                {transaction.leadSource && (
                  <div>
                    <p className="text-sm text-slate-400">Lead Source</p>
                    <p className="text-white">{transaction.leadSource}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline & Dates */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-400" />
                Timeline
              </h3>
              <div className="space-y-3 bg-slate-800/50 rounded-lg p-4">
                {transaction.createdDate && (
                  <div>
                    <p className="text-sm text-slate-400">Created</p>
                    <p className="text-white">{new Date(transaction.createdDate).toLocaleDateString()}</p>
                  </div>
                )}
                {transaction.contractDate && (
                  <div>
                    <p className="text-sm text-slate-400">Contract Date</p>
                    <p className="text-white">{new Date(transaction.contractDate).toLocaleDateString()}</p>
                  </div>
                )}
                {transaction.closingDate && (
                  <div>
                    <p className="text-sm text-slate-400">Closing Date</p>
                    <p className="text-white font-medium">{new Date(transaction.closingDate).toLocaleDateString()}</p>
                  </div>
                )}
                {transaction.lastUpdated && (
                  <div>
                    <p className="text-sm text-slate-400">Last Updated</p>
                    <p className="text-white">{new Date(transaction.lastUpdated).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Details */}
            {(transaction.tags || transaction.notes || transaction.referralFee) && (
              <div className="space-y-4 md:col-span-2">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-cyan-400" />
                  Additional Details
                </h3>
                <div className="space-y-3 bg-slate-800/50 rounded-lg p-4">
                  {transaction.tags && (
                    <div>
                      <p className="text-sm text-slate-400 mb-2">Tags</p>
                      <div className="flex flex-wrap gap-2">
                        {transaction.tags.map((tag: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="border-slate-600 text-slate-300">
                            <Tag className="w-3 h-3 mr-1" />
                            {tag.trim()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {transaction.notes && (
                    <div>
                      <p className="text-sm text-slate-400">Notes</p>
                      <p className="text-white whitespace-pre-wrap">{transaction.notes}</p>
                    </div>
                  )}
                  {transaction.referralFee && (
                    <div>
                      <p className="text-sm text-slate-400">Referral Fee</p>
                      <p className="text-white">{formatCurrency(transaction.referralFee)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-t border-slate-700 bg-slate-800/50">
          <div className="text-sm text-slate-400">
            {transaction.loopId && (
              <span className="font-mono">Loop ID: {transaction.loopId}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {transaction.dotloopUrl && (
              <Button
                variant="outline"
                onClick={() => window.open(transaction.dotloopUrl, '_blank')}
                className="border-slate-600 text-white hover:bg-slate-700"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View in Dotloop
              </Button>
            )}
            <Button
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
