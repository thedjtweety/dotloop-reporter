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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Shield, User, Search, Check, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function RoleManagement() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleChangeUserId, setRoleChangeUserId] = useState<number | null>(null);
  const [newRole, setNewRole] = useState<'user' | 'admin'>('user');
  const [targetUserName, setTargetUserName] = useState('');

  // Redirect if not admin
  if (!isAuthenticated || user?.role !== 'admin') {
    setLocation('/');
    return null;
  }

  // Fetch users
  const { data: usersData, refetch } = trpc.admin.listUsers.useQuery({ limit: 100, offset: 0 });

  // Update role mutation
  const updateRoleMutation = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => {
      refetch();
      setRoleChangeUserId(null);
    },
  });

  const handleRoleChange = (userId: number, currentRole: string, userName: string) => {
    setRoleChangeUserId(userId);
    setNewRole(currentRole === 'admin' ? 'user' : 'admin');
    setTargetUserName(userName);
  };

  const confirmRoleChange = () => {
    if (roleChangeUserId) {
      updateRoleMutation.mutate({ userId: roleChangeUserId, role: newRole });
    }
  };

  // Filter users based on search
  const filteredUsers = usersData?.filter((u: any) =>
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const totalUsers = usersData?.length || 0;
  const adminCount = usersData?.filter((u: any) => u.role === 'admin').length || 0;
  const userCount = totalUsers - adminCount;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-display font-bold text-foreground">
              <Shield className="inline-block h-6 w-6 mr-2" />
              Role Management
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Total Users</div>
            <div className="text-2xl font-bold">{totalUsers}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Administrators</div>
            <div className="text-2xl font-bold text-primary">{adminCount}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Regular Users</div>
            <div className="text-2xl font-bold">{userCount}</div>
          </Card>
        </div>

        {/* Search */}
        <Card className="p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        {/* Users Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Uploads</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers?.map((u: any) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div className="font-medium">{u.name || 'Unknown'}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{u.email || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                        {u.role === 'admin' ? (
                          <>
                            <Shield className="h-3 w-3 mr-1" />
                            Admin
                          </>
                        ) : (
                          <>
                            <User className="h-3 w-3 mr-1" />
                            User
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>{u.uploadCount}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDistanceToNow(new Date(u.lastSignedIn), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      {u.id === user?.id ? (
                        <span className="text-sm text-muted-foreground">You</span>
                      ) : (
                        <Button
                          variant={u.role === 'admin' ? 'destructive' : 'default'}
                          size="sm"
                          onClick={() => handleRoleChange(u.id, u.role, u.name || 'Unknown')}
                        >
                          {u.role === 'admin' ? (
                            <>
                              <X className="h-3 w-3 mr-1" />
                              Demote
                            </>
                          ) : (
                            <>
                              <Check className="h-3 w-3 mr-1" />
                              Promote
                            </>
                          )}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </main>

      {/* Role Change Confirmation Dialog */}
      <AlertDialog open={roleChangeUserId !== null} onOpenChange={() => setRoleChangeUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {newRole === 'admin' ? 'Promote to Admin' : 'Demote to User'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {newRole === 'admin' ? (
                <>
                  Are you sure you want to promote <strong>{targetUserName}</strong> to administrator?
                  They will have full access to the admin dashboard, user management, and system settings.
                </>
              ) : (
                <>
                  Are you sure you want to demote <strong>{targetUserName}</strong> to regular user?
                  They will lose access to the admin dashboard and all administrative privileges.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRoleChange}
              className={newRole === 'user' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {newRole === 'admin' ? 'Promote' : 'Demote'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
