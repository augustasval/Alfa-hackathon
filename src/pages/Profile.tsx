import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  User, Mail, GraduationCap, Copy, Check, RefreshCw, Clock, LogOut, CreditCard, Calendar
} from "lucide-react";
import { format, differenceInDays, parseISO, differenceInHours } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Profile = () => {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  // Profile state
  const [copied, setCopied] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (profile) {
      fetchFreshInviteCode();
    }
  }, [profile]);

  async function fetchFreshInviteCode() {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .rpc('get_fresh_invite_code', { user_id: profile.id });

      if (error) throw error;

      if (data && data.length > 0) {
        setInviteCode(data[0].invite_code);
        setExpiresAt(data[0].expires_at);
      }
    } catch (error) {
      console.error('Error fetching invite code:', error);
      setInviteCode(profile.invite_code);
      setExpiresAt(profile.invite_code_expires_at);
    }
  }

  async function handleRefreshCode() {
    if (!profile?.id) return;

    setRefreshing(true);
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ invite_code_expires_at: new Date(0).toISOString() })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      await fetchFreshInviteCode();
      toast.success('Invite code refreshed!');
    } catch (error) {
      console.error('Error refreshing invite code:', error);
      toast.error('Failed to refresh invite code');
    } finally {
      setRefreshing(false);
    }
  }

  function copyToClipboard() {
    if (!inviteCode) return;

    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    toast.success('Invite code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  }

  function getTimeUntilExpiration() {
    if (!expiresAt) return null;

    const expDate = parseISO(expiresAt);
    const now = new Date();
    const daysLeft = differenceInDays(expDate, now);
    const hoursLeft = differenceInHours(expDate, now) % 24;

    if (daysLeft > 0) {
      return `${daysLeft} day${daysLeft !== 1 ? 's' : ''} ${hoursLeft}h`;
    } else if (hoursLeft > 0) {
      return `${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''}`;
    } else {
      return 'Expiring soon';
    }
  }

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/logo/logo.svg" alt="CorePus Logo" className="h-12 w-12" />
              <img src="/name/brand-name.svg" alt="CorePus" className="h-14" />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/pricing')}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Plans
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <Navigation />

          {/* Profile Content */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{profile?.email}</p>
                  </div>
                </div>

                {profile?.name && (
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">{profile.name}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <GraduationCap className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Role</p>
                    <Badge variant="secondary" className="mt-1 capitalize">{profile?.role}</Badge>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Member since</p>
                    <p className="font-medium">
                      {profile?.created_at && format(parseISO(profile.created_at), 'MMMM d, yyyy')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Copy className="h-5 w-5" />
                  Your Invite Code
                </CardTitle>
                <CardDescription>
                  Share this code with your parent to link your accounts.
                  The code changes every 2 weeks for security.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <div className="flex items-center justify-between p-4 bg-primary/5 border-2 border-primary/20 rounded-lg">
                    <code className="text-lg font-mono font-bold tracking-wider text-primary">
                      {inviteCode || profile?.invite_code}
                    </code>
                    <Button variant="ghost" size="icon" onClick={copyToClipboard} className="shrink-0">
                      {copied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      Expires in: <span className="font-medium text-foreground">{getTimeUntilExpiration()}</span>
                    </span>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleRefreshCode} disabled={refreshing}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh Code
                  </Button>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">How to use your invite code:</h4>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Share this code with your parent</li>
                    <li>They can enter it in their parent dashboard</li>
                    <li>Once linked, they can view your progress</li>
                  </ol>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Subscription</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Badge
                    variant={profile?.subscription_status === 'active' ? 'default' : 'secondary'}
                    className="capitalize"
                  >
                    {profile?.subscription_status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {profile?.subscription_status === 'trial' && 'You are currently on a free trial'}
                    {profile?.subscription_status === 'active' && 'Your subscription is active'}
                    {!profile?.subscription_status && 'Free plan'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
