import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sun, Moon, Monitor, Building2, Shield, ChevronRight, Play, Lock, Eye, EyeOff, Loader2, TrendingUp, Bitcoin, ArrowDownToLine, ArrowUpToLine, FileText, LogOut } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AppLayout } from '@/components/layout/AppLayout';
import { useTheme } from '@/hooks/useTheme';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { DemoToggle } from '@/components/demo/DemoToggle';

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { profile, fetchProfile } = useProfile();
  const { isAdmin, user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };
  
  const [bankDetails, setBankDetails] = useState({
    bank_name: '',
    bank_account_name: '',
    bank_account_number: '',
    bank_routing_number: ''
  });
  const [saving, setSaving] = useState(false);
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (profile) {
      setBankDetails({
        bank_name: profile.bank_name || '',
        bank_account_name: profile.bank_account_name || '',
        bank_account_number: profile.bank_account_number || '',
        bank_routing_number: profile.bank_routing_number || ''
      });
    }
  }, [profile]);

  const handleSaveBankDetails = async () => {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        bank_name: bankDetails.bank_name,
        bank_account_name: bankDetails.bank_account_name,
        bank_account_number: bankDetails.bank_account_number,
        bank_routing_number: bankDetails.bank_routing_number
      })
      .eq('id', user.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to save bank details', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Bank details saved' });
      fetchProfile();
    }

    setSaving(false);
  };

  const handleReplayTutorial = () => {
    localStorage.removeItem('tamic_tutorial_completed');
    toast({ title: 'Tutorial Reset', description: 'The tutorial will play on your next visit to Dashboard' });
    navigate('/dashboard');
  };

  const handleChangePassword = async () => {
    if (!user) return;
    
    if (newPassword.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }

    setChangingPassword(true);

    // First verify current password by re-authenticating
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword,
    });

    if (signInError) {
      toast({ title: 'Error', description: 'Current password is incorrect', variant: 'destructive' });
      setChangingPassword(false);
      return;
    }

    // Update password
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Password changed successfully' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }

    setChangingPassword(false);
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account preferences
          </p>
        </div>

        {/* Quick Access - Mobile Only */}
        <div className="lg:hidden">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Access</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Link to="/stocks" className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Stocks</span>
              </Link>
              <Link to="/crypto" className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <Bitcoin className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Crypto</span>
              </Link>
              <Link to="/deposit" className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <ArrowDownToLine className="h-5 w-5 text-success" />
                <span className="text-sm font-medium">Deposit</span>
              </Link>
              <Link to="/withdraw" className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <ArrowUpToLine className="h-5 w-5 text-destructive" />
                <span className="text-sm font-medium">Withdraw</span>
              </Link>
              <Link to="/kyc" className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors col-span-2">
                <FileText className="h-5 w-5 text-warning" />
                <span className="text-sm font-medium">KYC Verification</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Demo Mode Toggle */}
        <Card className="lg:hidden">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Demo Mode</p>
              <p className="text-sm text-muted-foreground">Try app with sample data</p>
            </div>
            <DemoToggle />
          </CardContent>
        </Card>

        {/* Admin Panel Link */}
        {isAdmin && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <Link to="/admin" className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">Admin Panel</p>
                    <p className="text-sm text-muted-foreground">Manage users, KYC, and settings</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Tutorial */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              App Tutorial
            </CardTitle>
            <CardDescription>
              Watch the guided tour of TAMIC GROUP features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleReplayTutorial} variant="outline" className="gap-2">
              <Play className="h-4 w-4" />
              Replay Tutorial
            </Button>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Change Password
            </CardTitle>
            <CardDescription>
              Update your account password
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Current Password</Label>
              <div className="relative mt-1">
                <Input
                  type={showCurrentPassword ? "text" : "password"}
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <Label>New Password</Label>
              <div className="relative mt-1">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter new password (min. 6 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <Label>Confirm New Password</Label>
              <Input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button 
              onClick={handleChangePassword} 
              disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
            >
              {changingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Change Password'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Theme Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Choose how TAMIC GROUP looks to you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <button
                onClick={() => setTheme('light')}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 sm:p-4 rounded-lg border-2 transition-all",
                  theme === 'light' 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-background border flex items-center justify-center">
                  <Sun className="h-5 w-5 sm:h-6 sm:w-6 text-warning" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-foreground">Light</span>
              </button>

              <button
                onClick={() => setTheme('dark')}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 sm:p-4 rounded-lg border-2 transition-all",
                  theme === 'dark' 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-card border flex items-center justify-center">
                  <Moon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-foreground">Dark</span>
              </button>

              <button
                onClick={() => {
                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  setTheme(prefersDark ? 'dark' : 'light');
                }}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 sm:p-4 rounded-lg border-2 transition-all border-border hover:border-primary/50"
                )}
              >
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-muted border flex items-center justify-center">
                  <Monitor className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-foreground">System</span>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Bank Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Bank Details
            </CardTitle>
            <CardDescription>
              Add your bank details for withdrawals
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Bank Name</Label>
                <Input
                  placeholder="e.g. Chase, Bank of America"
                  value={bankDetails.bank_name}
                  onChange={(e) => setBankDetails({ ...bankDetails, bank_name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Account Holder Name</Label>
                <Input
                  placeholder="Name on the account"
                  value={bankDetails.bank_account_name}
                  onChange={(e) => setBankDetails({ ...bankDetails, bank_account_name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Account Number</Label>
                <Input
                  placeholder="Account number"
                  value={bankDetails.bank_account_number}
                  onChange={(e) => setBankDetails({ ...bankDetails, bank_account_number: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Routing Number</Label>
                <Input
                  placeholder="Routing number"
                  value={bankDetails.bank_routing_number}
                  onChange={(e) => setBankDetails({ ...bankDetails, bank_routing_number: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
            <Button onClick={handleSaveBankDetails} disabled={saving}>
              {saving ? 'Saving...' : 'Save Bank Details'}
            </Button>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Your account details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border gap-2">
              <span className="text-sm text-muted-foreground flex-shrink-0">Email</span>
              <span className="text-sm font-medium text-foreground truncate">{profile?.email}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border gap-2">
              <span className="text-sm text-muted-foreground flex-shrink-0">Full Name</span>
              <span className="text-sm font-medium text-foreground truncate">{profile?.full_name || 'Not set'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border gap-2">
              <span className="text-sm text-muted-foreground flex-shrink-0">Wallet ID</span>
              <span className="text-sm font-medium text-foreground font-mono truncate">{profile?.wallet_id || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center py-2 gap-2">
              <span className="text-sm text-muted-foreground flex-shrink-0">Balance</span>
              <span className="text-sm font-medium text-foreground">${profile?.balance?.toFixed(2) || '0.00'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Sign Out Button - Mobile */}
        <div className="lg:hidden pb-20">
          <Button 
            variant="outline" 
            className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
