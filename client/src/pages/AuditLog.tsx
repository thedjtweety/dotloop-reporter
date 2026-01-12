import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Shield, User, Upload, Settings as SettingsIcon, FileText } from 'lucide-react';

export default function AuditLog() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const limit = 50;

  // Redirect if not admin
  if (!isAuthenticated || user?.role !== 'admin') {
    setLocation('/');
    return null;
  }

  // Fetch audit logs
  const { data: logsData, isLoading } = trpc.auditLogs.list.useQuery({
    limit,
    offset: page * limit,
    action: actionFilter === 'all' ? undefined : actionFilter as any,
  });

  // Fetch stats
  const { data: stats } = trpc.auditLogs.getStats.useQuery();

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'user_created':
      case 'user_deleted':
      case 'user_role_changed':
        return <User className="h-4 w-4" />;
      case 'upload_deleted':
      case 'upload_viewed':
        return <Upload className="h-4 w-4" />;
      case 'settings_changed':
        return <SettingsIcon className="h-4 w-4" />;
      case 'data_exported':
        return <FileText className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'user_deleted':
      case 'upload_deleted':
        return 'text-red-600 dark:text-red-400';
      case 'user_role_changed':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'user_created':
        return 'text-green-600 dark:text-green-400';
      default:
        return 'text-blue-600 dark:text-blue-400';
    }
  };

  const formatAction = (action: string) => {
    return action
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-display font-bold text-foreground">
              <Shield className="inline-block h-6 w-6 mr-2" />
              Audit Log
            </h1>
          </div>
          <Button variant="ghost" onClick={() => setLocation('/admin')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin
          </Button>
        </div>
      </header>

      <main className="container py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <div className="text-sm text-foreground mb-1">Total Events</div>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-foreground mb-1">Last 24 Hours</div>
            <div className="text-2xl font-bold">{stats?.recentActivity || 0}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-foreground mb-1">Active Admins</div>
            <div className="text-2xl font-bold">{stats?.activeAdmins?.length || 0}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-foreground mb-1">Event Types</div>
            <div className="text-2xl font-bold">{stats?.byAction?.length || 0}</div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Filter by Action</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="user_created">User Created</SelectItem>
                  <SelectItem value="user_deleted">User Deleted</SelectItem>
                  <SelectItem value="user_role_changed">Role Changed</SelectItem>
                  <SelectItem value="upload_deleted">Upload Deleted</SelectItem>
                  <SelectItem value="upload_viewed">Upload Viewed</SelectItem>
                  <SelectItem value="settings_changed">Settings Changed</SelectItem>
                  <SelectItem value="data_exported">Data Exported</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Audit Log Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Loading audit logs...
                  </TableCell>
                </TableRow>
              ) : logsData?.logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-foreground">
                    No audit logs found
                  </TableCell>
                </TableRow>
              ) : (
                logsData?.logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-sm">
                      {formatDate(log.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className={`flex items-center gap-2 ${getActionColor(log.action)}`}>
                        {getActionIcon(log.action)}
                        <span className="font-medium">{formatAction(log.action)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{log.adminName}</div>
                        <div className="text-sm text-foreground">{log.adminEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.targetName ? (
                        <div>
                          <div className="font-medium">{log.targetName}</div>
                          <div className="text-sm text-foreground">
                            {log.targetType} #{log.targetId}
                          </div>
                        </div>
                      ) : (
                        <span className="text-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {log.details ? (
                        <div className="text-sm font-mono text-foreground max-w-xs truncate">
                          {log.details}
                        </div>
                      ) : (
                        <span className="text-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {logsData && logsData.logs.length > 0 && (
            <div className="flex items-center justify-between p-4 border-t">
              <div className="text-sm text-foreground">
                Showing {page * limit + 1} to {page * limit + logsData.logs.length} of {logsData.total}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={!logsData.hasMore}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
