/**
 * AccountSwitcher Component
 * 
 * Dropdown menu for managing multiple Dotloop accounts:
 * - Display list of connected accounts
 * - Switch between accounts
 * - Add new account
 * - Remove accounts
 * - Logout (clear all accounts)
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, UserCircle, Plus, Trash2, LogOut, Check, Settings } from 'lucide-react';
import { useLocation } from 'wouter';
import {
  getAllAccounts,
  getActiveAccount,
  setActiveAccount,
  removeAccount,
  clearAllAccounts,
  getAuthorizationUrl,
  revokeToken,
  type DotloopAccount,
} from '@/lib/dotloopAuth';

interface AccountSwitcherProps {
  onAccountChange?: (account: DotloopAccount | null) => void;
  onLogout?: () => void;
}

export default function AccountSwitcher({ onAccountChange, onLogout }: AccountSwitcherProps) {
  const [, setLocation] = useLocation();
  const [accounts] = useState<DotloopAccount[]>(getAllAccounts());
  const [activeAccount, setActiveAccountState] = useState<DotloopAccount | null>(getActiveAccount());

  const handleSwitchAccount = (accountId: string) => {
    setActiveAccount(accountId);
    const newActive = getAllAccounts().find(acc => acc.id === accountId) || null;
    setActiveAccountState(newActive);
    onAccountChange?.(newActive);
  };

  const handleRemoveAccount = async (accountId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const account = accounts.find(acc => acc.id === accountId);
    if (!account) return;
    
    // Revoke token on backend
    await revokeToken(account.accessToken);
    
    // Remove from localStorage
    removeAccount(accountId);
    
    // Update state
    const remainingAccounts = getAllAccounts();
    const newActive = getActiveAccount();
    setActiveAccountState(newActive);
    onAccountChange?.(newActive);
    
    // If no accounts left, trigger logout
    if (remainingAccounts.length === 0) {
      onLogout?.();
    }
  };

  const handleAddAccount = () => {
    // Redirect to OAuth flow
    window.location.href = getAuthorizationUrl();
  };

  const handleLogout = async () => {
    // Revoke all tokens
    for (const account of accounts) {
      await revokeToken(account.accessToken);
    }
    
    // Clear all accounts
    clearAllAccounts();
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Trigger logout callback
    onLogout?.();
  };

  if (accounts.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <UserCircle className="h-4 w-4" />
          <span className="hidden sm:inline">
            {activeAccount ? `${activeAccount.firstName} ${activeAccount.lastName}` : 'Select Account'}
          </span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Connected Accounts</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {accounts.map((account) => (
          <DropdownMenuItem
            key={account.id}
            onClick={() => handleSwitchAccount(account.id)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2 flex-1">
              {activeAccount?.id === account.id && (
                <Check className="h-4 w-4 text-primary" />
              )}
              <div className="flex flex-col">
                <span className="font-medium">
                  {account.firstName} {account.lastName}
                </span>
                <span className="text-xs text-foreground/70">
                  {account.email}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => handleRemoveAccount(account.id, e)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => setLocation('/account-profile')} className="cursor-pointer">
          <Settings className="h-4 w-4 mr-2" />
          Account Settings
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleAddAccount} className="cursor-pointer">
          <Plus className="h-4 w-4 mr-2" />
          Add Another Account
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
          <LogOut className="h-4 w-4 mr-2" />
          Logout All Accounts
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
