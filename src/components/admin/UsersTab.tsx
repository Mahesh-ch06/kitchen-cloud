import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Mail, Phone, Calendar, Shield, 
  ChefHat, Truck, Crown, MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserWithRole, useUpdateUserRole } from '@/hooks/useAdminData';
import { toast } from 'sonner';
import { FadeIn } from '@/components/ui/animated-container';
import { format } from 'date-fns';

interface UsersTabProps {
  users: UserWithRole[] | undefined;
  isLoading: boolean;
}

const roleIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  customer: User,
  vendor: ChefHat,
  delivery_partner: Truck,
  admin: Crown,
};

const roleColors: Record<string, string> = {
  customer: 'bg-secondary text-secondary-foreground',
  vendor: 'bg-primary/20 text-primary',
  delivery_partner: 'bg-success/20 text-success',
  admin: 'bg-accent/20 text-accent',
};

const roleLabels: Record<string, string> = {
  customer: 'Customer',
  vendor: 'Vendor',
  delivery_partner: 'Delivery Partner',
  admin: 'Admin',
};

export function UsersTab({ users, isLoading }: UsersTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const updateRoleMutation = useUpdateUserRole();

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await updateRoleMutation.mutateAsync({ userId, role: newRole });
      
      if (newRole === 'delivery_partner' || newRole === 'vendor') {
        toast.success(`User role updated to ${roleLabels[newRole]}. Check Verifications tab to approve their account.`);
      } else {
        toast.success(`User role updated to ${roleLabels[newRole]}`);
      }
    } catch (error: any) {
      console.error('Role change error:', error);
      const errorMessage = error?.message || error?.error_description || 'Unknown error';
      toast.error(`Failed to update user role: ${errorMessage}`);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-sm" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    );
  }

  const filteredUsers = users?.filter(user => {
    const matchesSearch = 
      !searchQuery ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = !roleFilter || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  }) || [];

  const roleCounts = users?.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <div className="space-y-6">
      {/* Filters */}
      <FadeIn>
        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={roleFilter === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRoleFilter(null)}
            >
              All ({users?.length || 0})
            </Button>
            {Object.entries(roleLabels).map(([role, label]) => (
              <Button
                key={role}
                variant={roleFilter === role ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRoleFilter(role)}
              >
                {label} ({roleCounts[role] || 0})
              </Button>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* Users List */}
      <FadeIn delay={0.1}>
        <div className="rounded-2xl bg-card border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">User</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Contact</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Role</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Joined</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-muted-foreground">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <UserRow 
                      key={user.id} 
                      user={user} 
                      onRoleChange={handleRoleChange}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}

interface UserRowProps {
  user: UserWithRole;
  onRoleChange: (userId: string, role: string) => void;
}

function UserRow({ user, onRoleChange }: UserRowProps) {
  const fullName = [user.first_name, user.last_name]
    .filter(Boolean)
    .join(' ') || 'Unknown User';

  const RoleIcon = roleIcons[user.role] || User;

  return (
    <motion.tr
      whileHover={{ backgroundColor: 'hsl(var(--secondary) / 0.3)' }}
      className="border-b border-border/50 transition-colors"
    >
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <User className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">{fullName}</p>
            <p className="text-xs text-muted-foreground">ID: {user.id.slice(0, 8)}...</p>
          </div>
        </div>
      </td>
      <td className="py-4 px-4">
        <div className="space-y-1">
          {user.email && (
            <p className="text-sm flex items-center gap-1">
              <Mail className="w-3 h-3 text-muted-foreground" />
              {user.email}
            </p>
          )}
          {user.phone && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Phone className="w-3 h-3" />
              {user.phone}
            </p>
          )}
        </div>
      </td>
      <td className="py-4 px-4">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${roleColors[user.role]}`}>
          <RoleIcon className="w-3 h-3" />
          {roleLabels[user.role]}
        </span>
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Calendar className="w-3 h-3" />
          {format(new Date(user.created_at), 'MMM d, yyyy')}
        </div>
      </td>
      <td className="py-4 px-4 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem disabled className="text-xs text-muted-foreground">
              Change Role
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {Object.entries(roleLabels).map(([role, label]) => {
              const Icon = roleIcons[role];
              return (
                <DropdownMenuItem
                  key={role}
                  onClick={() => onRoleChange(user.id, role)}
                  disabled={user.role === role}
                  className={user.role === role ? 'bg-secondary' : ''}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {label}
                  {user.role === role && ' (current)'}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </motion.tr>
  );
}
