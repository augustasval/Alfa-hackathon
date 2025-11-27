import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Check, Plus, LogOut, ChevronDown } from 'lucide-react';
import { AddAccountModal } from './AddAccountModal';

export function AccountSwitcher() {
  const { user, profile, accounts, switchAccount, signOutOne, signOutAll } = useAuth();
  const [showAddAccount, setShowAddAccount] = useState(false);

  if (!user || !profile) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadge = (role: 'parent' | 'student') => {
    return role === 'parent' ? 'Parent' : 'Student';
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {getInitials(profile.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start text-left">
              <span className="text-sm font-medium">{profile.full_name}</span>
              <span className="text-xs text-muted-foreground">
                {getRoleBadge(profile.role)}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Switch Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {accounts.map((account) => {
            const isActive = account.userId === user.id;
            return (
              <DropdownMenuItem
                key={account.userId}
                onClick={() => !isActive && switchAccount(account.userId)}
                className="flex items-center gap-3 cursor-pointer"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {getInitials(account.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="text-sm font-medium">{account.fullName}</div>
                  <div className="text-xs text-muted-foreground">{account.email}</div>
                  <div className="text-xs text-muted-foreground">
                    {getRoleBadge(account.role)}
                  </div>
                </div>
                {isActive && <Check className="h-4 w-4 text-primary" />}
              </DropdownMenuItem>
            );
          })}

          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            onClick={() => setShowAddAccount(true)}
            className="cursor-pointer"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Another Account
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {accounts.length > 1 && (
            <DropdownMenuItem
              onClick={() => signOutOne(user.id)}
              className="cursor-pointer text-muted-foreground"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out This Account
            </DropdownMenuItem>
          )}

          <DropdownMenuItem
            onClick={signOutAll}
            className="cursor-pointer text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out All Accounts
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AddAccountModal open={showAddAccount} onOpenChange={setShowAddAccount} />
    </>
  );
}
