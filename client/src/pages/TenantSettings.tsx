import { useState } from 'react';
import { trpc } from '../lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import SeedDataButton from '../components/SeedDataButton';

import { 
  Building2, 
  Globe, 
  CreditCard, 
  Users, 
  Database, 
  HardDrive,
  CheckCircle2,
  XCircle,
  Link as LinkIcon,
  Settings as SettingsIcon,
  Zap
} from 'lucide-react';

export default function TenantSettings() {

  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedSubdomain, setEditedSubdomain] = useState('');
  const [editedCustomDomain, setEditedCustomDomain] = useState('');

  // Fetch tenant data
  const { data: tenant, isLoading: tenantLoading, refetch: refetchTenant } = trpc.tenantSettings.getTenant.useQuery();
  const { data: subscription, isLoading: subscriptionLoading } = trpc.tenantSettings.getSubscription.useQuery();
  const { data: stats, isLoading: statsLoading } = trpc.tenantSettings.getStats.useQuery();
  const { data: oauthStatus, isLoading: oauthLoading } = trpc.dotloopOAuth.getConnectionStatus.useQuery();

  // Mutations
  const updateProfile = trpc.tenantSettings.updateProfile.useMutation({
    onSuccess: () => {
      alert('Profile updated successfully!');
      setIsEditing(false);
      refetchTenant();
    },
    onError: (error) => {
      alert(`Update failed: ${error.message}`);
    },
  });

  const handleSaveProfile = () => {
    updateProfile.mutate({
      name: editedName || undefined,
      subdomain: editedSubdomain || undefined,
      customDomain: editedCustomDomain || undefined,
    });
  };

  const handleStartEdit = () => {
    setEditedName(tenant?.name || '');
    setEditedSubdomain(tenant?.subdomain || '');
    setEditedCustomDomain(tenant?.customDomain || '');
    setIsEditing(true);
  };

  if (tenantLoading || subscriptionLoading || statsLoading || oauthLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3">
          <SettingsIcon className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Tenant Settings</h1>
        </div>
        <div className="text-foreground/70">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SettingsIcon className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Tenant Settings</h1>
        </div>
        <Badge variant={tenant?.status === 'active' ? 'default' : 'destructive'}>
          {tenant?.status}
        </Badge>
      </div>

      {/* Tenant Profile */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              <CardTitle>Tenant Profile</CardTitle>
            </div>
            {!isEditing && (
              <Button onClick={handleStartEdit} variant="outline" size="sm">
                Edit Profile
              </Button>
            )}
          </div>
          <CardDescription>Manage your organization's information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Organization Name</Label>
                <Input
                  id="name"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  placeholder="Enter organization name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subdomain">Subdomain</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="subdomain"
                    value={editedSubdomain}
                    onChange={(e) => setEditedSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="your-subdomain"
                  />
                  <span className="text-sm text-foreground/70">.manus.space</span>
                </div>
                <p className="text-xs text-foreground/70">Lowercase letters, numbers, and hyphens only</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="customDomain">Custom Domain (Optional)</Label>
                <Input
                  id="customDomain"
                  value={editedCustomDomain}
                  onChange={(e) => setEditedCustomDomain(e.target.value)}
                  placeholder="reports.yourdomain.com"
                />
                <p className="text-xs text-foreground/70">Configure DNS CNAME to point to your subdomain</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveProfile} disabled={updateProfile.isPending}>
                  {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button onClick={() => setIsEditing(false)} variant="outline">
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div>
                <div className="text-sm text-foreground/70">Organization Name</div>
                <div className="text-lg font-semibold">{tenant?.name}</div>
              </div>
              <div>
                <div className="text-sm text-foreground/70">Subdomain</div>
                <div className="text-lg font-mono">{tenant?.subdomain}.manus.space</div>
              </div>
              {tenant?.customDomain && (
                <div>
                  <div className="text-sm text-foreground/70">Custom Domain</div>
                  <div className="text-lg font-mono">{tenant.customDomain}</div>
                </div>
              )}
              <div>
                <div className="text-sm text-foreground/70">Tenant ID</div>
                <div className="text-sm font-mono">{tenant?.id}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            <CardTitle>Subscription</CardTitle>
          </div>
          <CardDescription>Your current plan and features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{subscription?.tierInfo?.name}</div>
              <div className="text-sm text-foreground/70">Current Plan</div>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              {subscription?.currentTier}
            </Badge>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <div className="text-sm font-semibold">Plan Features</div>
            <ul className="space-y-1">
              {subscription?.tierInfo?.features.map((feature: string, index: number) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <Separator />

          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-foreground/70">Max Users</div>
              <div className="text-lg font-semibold">
                {subscription?.tierInfo?.maxUsers === -1 ? 'Unlimited' : subscription?.tierInfo?.maxUsers}
              </div>
            </div>
            <div>
              <div className="text-sm text-foreground/70">Max Uploads/Month</div>
              <div className="text-lg font-semibold">
                {subscription?.tierInfo?.maxUploadsPerMonth === -1 ? 'Unlimited' : subscription?.tierInfo?.maxUploadsPerMonth}
              </div>
            </div>
            <div>
              <div className="text-sm text-foreground/70">Max Storage</div>
              <div className="text-lg font-semibold">
                {subscription?.tierInfo?.maxStorageGB === -1 ? 'Unlimited' : `${subscription?.tierInfo?.maxStorageGB} GB`}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Statistics */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <CardTitle>Usage Statistics</CardTitle>
          </div>
          <CardDescription>Current usage across your tenant</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{stats?.users}</div>
                <div className="text-sm text-foreground/70">Users</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Database className="h-8 w-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{stats?.uploads}</div>
                <div className="text-sm text-foreground/70">Uploads</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{stats?.transactions}</div>
                <div className="text-sm text-foreground/70">Transactions</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <HardDrive className="h-8 w-8 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">{stats?.storageGB}</div>
                <div className="text-sm text-foreground/70">GB Used</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dotloop Integration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            <CardTitle>Dotloop Integration</CardTitle>
          </div>
          <CardDescription>Connect your Dotloop account for automatic data sync</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {oauthStatus?.connected ? (
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              ) : (
                <XCircle className="h-6 w-6 text-foreground/40" />
              )}
              <div>
                <div className="font-semibold">
                  {oauthStatus?.connected ? 'Connected' : 'Not Connected'}
                </div>
                <div className="text-sm text-foreground/70">{oauthStatus?.message}</div>
              </div>
            </div>
            <Button variant={oauthStatus?.connected ? 'outline' : 'default'} disabled>
              {oauthStatus?.connected ? 'Manage Connection' : 'Connect Dotloop'}
            </Button>
          </div>

          {oauthStatus?.connected && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-foreground/70">Connected At</div>
                  <div className="font-mono">
                    {oauthStatus.connectedAt ? new Date(oauthStatus.connectedAt).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-foreground/70">Last Used</div>
                  <div className="font-mono">
                    {oauthStatus.lastUsedAt 
                      ? new Date(oauthStatus.lastUsedAt).toLocaleDateString()
                      : 'Never'}
                  </div>
                </div>
                <div>
                  <div className="text-foreground/70">Token Expires</div>
                  <div className="font-mono">
                    {oauthStatus.expiresAt ? new Date(oauthStatus.expiresAt).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-foreground/70">Status</div>
                  <Badge variant={oauthStatus.isExpired ? 'destructive' : 'default'}>
                    {oauthStatus.isExpired ? 'Expired' : 'Active'}
                  </Badge>
                </div>
              </div>
            </>
          )}

          {!oauthStatus?.connected && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-foreground/70">
                <strong>Note:</strong> Dotloop OAuth credentials are not yet configured. 
                Please contact your administrator to set up the integration.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sample Data Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            <CardTitle>Sample Data Management</CardTitle>
          </div>
          <CardDescription>Populate test commission plans and agents for development and testing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-foreground/70">
              Use the button below to seed your database with sample commission plans and agent assignments. This is useful for testing the commission calculator and other features without manual data entry.
            </p>
            <SeedDataButton onSuccess={() => refetchTenant()} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
