import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown, Plus, Trash2, User } from "lucide-react";
import {
  getAllAccounts,
  getActiveAccountId,
  setActiveAccount,
  removeAccount,
  revokeAccountToken,
  type DotloopAccount,
} from "@/lib/dotloopMultiAuth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import toast from 'react-hot-toast';

interface AccountSwitcherProps {
  onAccountChange?: () => void;
  onAddAccount?: () => void;
}

export default function AccountSwitcher({ onAccountChange, onAddAccount }: AccountSwitcherProps) {
  const [accounts, setAccounts] = useState<DotloopAccount[]>(getAllAccounts());
  const [activeAccountId, setActiveAccountIdState] = useState<string | null>(getActiveAccountId());
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [accountToRemove, setAccountToRemove] = useState<DotloopAccount | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const activeAccount = accounts.find(acc => acc.id === activeAccountId);

  const handleSwitchAccount = (accountId: string) => {
    if (setActiveAccount(accountId)) {
      setActiveAccountIdState(accountId);
      toast.success(`Switched to ${accounts.find(acc => acc.id === accountId)?.email}`);
      onAccountChange?.();
    }
  };

  const handleRemoveClick = (account: DotloopAccount, e: React.MouseEvent) => {
    e.stopPropagation();
    setAccountToRemove(account);
    setShowRemoveConfirm(true);
  };

  const handleRemoveConfirm = async () => {
    if (!accountToRemove) return;
    
    setIsRemoving(true);
    
    try {
      // Revoke token first
      const revoked = await revokeAccountToken(accountToRemove.id);
      if (!revoked) {
        console.warn('[AccountSwitcher] Token revocation failed, but continuing with removal');
      }
      
      // Remove from storage
      if (removeAccount(accountToRemove.id)) {
        const updatedAccounts = getAllAccounts();
        setAccounts(updatedAccounts);
        setActiveAccountIdState(getActiveAccountId());
        
        toast.success(`Removed account: ${accountToRemove.email}`);
        onAccountChange?.();
      } else {
        toast.error('Failed to remove account');
      }
    } catch (error) {
      console.error('[AccountSwitcher] Remove error:', error);
      toast.error('Failed to remove account');
    } finally {
      setIsRemoving(false);
      setShowRemoveConfirm(false);
      setAccountToRemove(null);
    }
  };

  if (accounts.length === 0) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">{activeAccount?.email || 'Select Account'}</span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Dotloop Accounts</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {accounts.map((account) => (
            <DropdownMenuItem
              key={account.id}
              onClick={() => handleSwitchAccount(account.id)}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2 flex-1">
                {account.id === activeAccountId && (
                  <Check className="h-4 w-4 text-primary" />
                )}
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{account.email}</span>
                  <span className="text-xs text-muted-foreground">
                    {account.firstName} {account.lastName}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                onClick={(e) => handleRemoveClick(account, e)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onAddAccount}
            className="flex items-center gap-2 cursor-pointer text-primary"
          >
            <Plus className="h-4 w-4" />
            <span>Add Another Account</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Remove Account Confirmation Dialog */}
      <AlertDialog open={showRemoveConfirm} onOpenChange={setShowRemoveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Dotloop Account?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{accountToRemove?.email}</strong>?
              <br /><br />
              This will:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Revoke the access token with Dotloop</li>
                <li>Remove all local data for this account</li>
                <li>Require re-authentication to access this account again</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveConfirm}
              disabled={isRemoving}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isRemoving ? 'Removing...' : 'Remove Account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
