import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Clock, User, FileText, Shield, Trash2, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useLocation } from 'wouter';

export default function RecentActivity() {
  const [, setLocation] = useLocation();
  
  // Fetch recent audit logs
  const { data: auditData } = trpc.auditLogs.list.useQuery({ limit: 5, offset: 0 });
  const { data: stats } = trpc.auditLogs.getStats.useQuery();

  const recentLogs = (auditData?.logs || []) as Array<{
    id: number;
    adminId: number;
    adminName: string;
    adminEmail: string | null;
    action: string;
    targetType: string | null;
    targetId: number | null;
    targetName: string | null;
    details: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: Date;
  }>;

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'user_deleted':
        return <Trash2 className="h-4 w-4 text-red-600" />;
      case 'user_role_changed':
        return <Shield className="h-4 w-4 text-blue-600" />;
      case 'upload_deleted':
        return <FileText className="h-4 w-4 text-orange-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'user_deleted':
        return 'User Deleted';
      case 'user_role_changed':
        return 'Role Changed';
      case 'upload_deleted':
        return 'Upload Deleted';
      default:
        return action;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'user_deleted':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'user_role_changed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'upload_deleted':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  // Calculate today's activity count
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayActions = recentLogs.filter(log => new Date(log.createdAt) >= todayStart).length;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Recent Activity
          </h3>
          <p className="text-sm text-foreground/70 mt-1">
            Last 5 admin actions
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setLocation('/audit-log')}>
          View All
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
          <div className="text-xs text-foreground/70 mb-1">Today's Actions</div>
          <div className="text-2xl font-bold text-foreground">{todayActions}</div>
        </div>
        <div className="p-3 rounded-lg bg-accent/5 border border-accent/10">
          <div className="text-xs text-foreground/70 mb-1">Active Admins</div>
          <div className="text-2xl font-bold text-foreground">{Array.isArray(stats?.activeAdmins) ? stats.activeAdmins.length : 0}</div>
        </div>
      </div>

      {/* Recent Logs */}
      <div className="space-y-3">
        {recentLogs.length === 0 ? (
          <div className="text-center py-8 text-foreground/70">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No recent activity</p>
          </div>
        ) : (
          recentLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
            >
              <div className="mt-0.5">
                {getActionIcon(log.action)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className={`text-xs ${getActionColor(log.action)}`}>
                    {getActionLabel(log.action)}
                  </Badge>
                  <span className="text-xs text-foreground/70 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <div className="text-sm text-foreground">
                  <span className="font-medium">{log.adminName}</span>
                  {log.action === 'user_deleted' && (
                    <> deleted user <span className="font-medium">{log.targetName}</span></>
                  )}
                  {log.action === 'user_role_changed' && (
                    <> changed role for <span className="font-medium">{log.targetName}</span></>
                  )}
                  {log.action === 'upload_deleted' && (
                    <> deleted upload <span className="font-medium">{log.targetName}</span></>
                  )}
                </div>
                {log.details && (
                  <div className="text-xs text-foreground/70 mt-1">
                    {(() => {
                      try {
                        const details = JSON.parse(log.details);
                        if (details.newRole) {
                          return `New role: ${details.newRole}`;
                        }
                        if (details.recordCount) {
                          return `${details.recordCount} records`;
                        }
                        return null;
                      } catch {
                        return null;
                      }
                    })()}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
