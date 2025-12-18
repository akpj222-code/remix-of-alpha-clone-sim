import { useState, useEffect } from 'react';
import { Users, FileCheck, Clock, XCircle, CheckCircle2, Eye, Search, DollarSign, Wallet, Settings2, Plus, Minus, ArrowDownToLine, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface KYCRequestWithProfile {
  id: string;
  user_id: string;
  account_type: 'individual' | 'corporate';
  status: 'pending' | 'approved' | 'rejected';
  full_name: string | null;
  company_name: string | null;
  submitted_at: string;
  id_document_url: string | null;
  selfie_url: string | null;
  cac_certificate_url: string | null;
  board_resolution_url: string | null;
  tax_clearance_url: string | null;
  rejection_reason: string | null;
  date_of_birth: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  profiles: { email: string } | null;
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  balance: number;
  wallet_id: string | null;
  created_at: string;
}

interface WithdrawalRequest {
  id: string;
  user_id: string;
  amount: number;
  method: string;
  crypto_type: string | null;
  wallet_address: string | null;
  status: string;
  created_at: string;
  profiles?: { email: string; full_name: string | null; wallet_id: string | null } | null;
}

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

interface AdminSettings {
  deposit_bank_name: string;
  deposit_bank_account: string;
  deposit_bank_routing: string;
  deposit_bank_account_name: string;
  deposit_btc_address: string;
  deposit_eth_address: string;
  deposit_usdt_address: string;
  tamg_share_price: string;
}

export default function Admin() {
  const [kycRequests, setKycRequests] = useState<KYCRequestWithProfile[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [selectedKYC, setSelectedKYC] = useState<KYCRequestWithProfile | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showKYCDetailsDialog, setShowKYCDetailsDialog] = useState(false);
  const [showUserEditDialog, setShowUserEditDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [fundAmount, setFundAmount] = useState('');
  const [fundAction, setFundAction] = useState<'add' | 'remove'>('add');
  const [adminSettings, setAdminSettings] = useState<AdminSettings>({
    deposit_bank_name: '',
    deposit_bank_account: '',
    deposit_bank_routing: '',
    deposit_bank_account_name: '',
    deposit_btc_address: '',
    deposit_eth_address: '',
    deposit_usdt_address: '',
    tamg_share_price: '25.00',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
    fetchUsers();
    fetchAdminSettings();
    fetchWithdrawals();
  }, []);

  const fetchData = async () => {
    const { data: kyc, error } = await supabase
      .from('kyc_requests')
      .select(`
        *,
        profiles:user_id (email)
      `)
      .order('submitted_at', { ascending: false });

    if (!error && kyc) {
      setKycRequests(kyc as unknown as KYCRequestWithProfile[]);
      
      const total = kyc.length;
      const pending = kyc.filter(k => k.status === 'pending').length;
      const approved = kyc.filter(k => k.status === 'approved').length;
      const rejected = kyc.filter(k => k.status === 'rejected').length;
      setStats({ total, pending, approved, rejected });
    }
    
    setLoading(false);
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setUsers(data as UserProfile[]);
    }
  };

  const fetchWithdrawals = async () => {
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .select(`
        *,
        profiles:user_id (email, full_name, wallet_id)
      `)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setWithdrawals(data as unknown as WithdrawalRequest[]);
    }
  };

  const fetchAdminSettings = async () => {
    const { data, error } = await supabase
      .from('admin_settings')
      .select('setting_key, setting_value');

    if (!error && data) {
      const settings: Partial<AdminSettings> = {};
      data.forEach((item: { setting_key: string; setting_value: string }) => {
        settings[item.setting_key as keyof AdminSettings] = item.setting_value;
      });
      setAdminSettings(prev => ({ ...prev, ...settings }));
    }
  };

  const updateAdminSetting = async (key: string, value: string) => {
    const { error } = await supabase
      .from('admin_settings')
      .upsert({ setting_key: key, setting_value: value, updated_at: new Date().toISOString() }, { onConflict: 'setting_key' });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Setting updated' });
      fetchAdminSettings();
    }
  };

  const handleApprove = async (id: string) => {
    const { error } = await supabase
      .from('kyc_requests')
      .update({ status: 'approved', reviewed_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'KYC application approved' });
      fetchData();
    }
  };

  const handleReject = async () => {
    if (!selectedKYC) return;

    const { error } = await supabase
      .from('kyc_requests')
      .update({ 
        status: 'rejected', 
        rejection_reason: rejectionReason,
        reviewed_at: new Date().toISOString() 
      })
      .eq('id', selectedKYC.id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'KYC application rejected' });
      setShowRejectDialog(false);
      setSelectedKYC(null);
      setRejectionReason('');
      fetchData();
    }
  };

  const handleUpdateUserFunds = async () => {
    if (!selectedUser || !fundAmount) return;

    const amount = parseFloat(fundAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Error', description: 'Please enter a valid amount', variant: 'destructive' });
      return;
    }

    const newBalance = fundAction === 'add' 
      ? selectedUser.balance + amount 
      : Math.max(0, selectedUser.balance - amount);

    const { error } = await supabase
      .from('profiles')
      .update({ balance: newBalance })
      .eq('id', selectedUser.id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ 
        title: 'Success', 
        description: `${fundAction === 'add' ? 'Added' : 'Removed'} $${amount.toFixed(2)} ${fundAction === 'add' ? 'to' : 'from'} user balance` 
      });
      setShowUserEditDialog(false);
      setSelectedUser(null);
      setFundAmount('');
      fetchUsers();
    }
  };

  const handleWithdrawalAction = async (id: string, status: 'approved' | 'declined' | 'completed') => {
    const { error } = await supabase
      .from('withdrawal_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `Withdrawal ${status}` });
      fetchWithdrawals();
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.wallet_id?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const pendingRequests = kycRequests.filter(k => k.status === 'pending');
  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
          <p className="text-muted-foreground">
            Manage users, KYC applications, and platform settings
          </p>
        </div>

        <Tabs defaultValue="kyc" className="space-y-6">
          <TabsList className="flex-wrap">
            <TabsTrigger value="kyc" className="gap-2">
              <FileCheck className="h-4 w-4" />
              <span className="hidden sm:inline">KYC</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="withdrawals" className="gap-2">
              <ArrowDownToLine className="h-4 w-4" />
              <span className="hidden sm:inline">Withdrawals</span>
              {pendingWithdrawals.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {pendingWithdrawals.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings2 className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* KYC Tab */}
          <TabsContent value="kyc" className="space-y-6">
            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Applications</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
                  <Clock className="h-4 w-4 text-warning" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-warning">{stats.pending}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-success" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-success">{stats.approved}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle>
                  <XCircle className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-destructive">{stats.rejected}</p>
                </CardContent>
              </Card>
            </div>

            {/* Pending KYC */}
            <Card>
              <CardHeader>
                <CardTitle>Pending KYC Applications</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingRequests.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No pending applications</p>
                ) : (
                  <div className="space-y-4">
                    {pendingRequests.map((kyc) => (
                      <div key={kyc.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground">
                              {kyc.account_type === 'individual' ? kyc.full_name : kyc.company_name}
                            </p>
                            <Badge variant="secondary">
                              {kyc.account_type === 'individual' ? 'Individual' : 'Corporate'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{kyc.profiles?.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Submitted: {new Date(kyc.submitted_at).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => { setSelectedKYC(kyc); setShowKYCDetailsDialog(true); }}
                          >
                            <Eye className="h-3 w-3 mr-1" /> View
                          </Button>
                          <Button size="sm" className="bg-success hover:bg-success/90" onClick={() => handleApprove(kyc.id)}>
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => { setSelectedKYC(kyc); setShowRejectDialog(true); }}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* All Applications */}
            <Card>
              <CardHeader>
                <CardTitle>All Applications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {kycRequests.map((kyc) => (
                    <div key={kyc.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium text-foreground">
                            {kyc.account_type === 'individual' ? kyc.full_name : kyc.company_name}
                          </p>
                          <p className="text-xs text-muted-foreground">{kyc.profiles?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => { setSelectedKYC(kyc); setShowKYCDetailsDialog(true); }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Badge className={cn(
                          kyc.status === 'approved' && 'bg-success/10 text-success',
                          kyc.status === 'pending' && 'bg-warning/10 text-warning',
                          kyc.status === 'rejected' && 'bg-destructive/10 text-destructive'
                        )}>
                          {kyc.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Search and manage user accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by email, name, or wallet ID..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <div className="space-y-3">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{user.full_name || 'N/A'}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Wallet className="h-3 w-3" />
                            {user.wallet_id || 'No wallet'}
                          </span>
                          <span className="text-xs font-medium text-success flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            ${user.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => { setSelectedUser(user); setShowUserEditDialog(true); }}
                      >
                        Manage Funds
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Withdrawals Tab */}
          <TabsContent value="withdrawals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pending Withdrawals</CardTitle>
                <CardDescription>Review and process withdrawal requests</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingWithdrawals.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No pending withdrawals</p>
                ) : (
                  <div className="space-y-4">
                    {pendingWithdrawals.map((withdrawal) => (
                      <div key={withdrawal.id} className="p-4 rounded-lg border">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <p className="font-medium text-foreground">
                              {withdrawal.profiles?.full_name || withdrawal.profiles?.email}
                            </p>
                            <p className="text-sm text-muted-foreground">{withdrawal.profiles?.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline">{withdrawal.method.toUpperCase()}</Badge>
                              {withdrawal.crypto_type && (
                                <Badge variant="secondary">{withdrawal.crypto_type.toUpperCase()}</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Wallet ID: {withdrawal.profiles?.wallet_id || 'N/A'}
                            </p>
                            {withdrawal.wallet_address && (
                              <p className="text-xs font-mono text-muted-foreground mt-1 break-all">
                                To: {withdrawal.wallet_address}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-foreground">
                              ${withdrawal.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(withdrawal.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button 
                            size="sm" 
                            className="bg-success hover:bg-success/90"
                            onClick={() => handleWithdrawalAction(withdrawal.id, 'completed')}
                          >
                            Mark Completed
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleWithdrawalAction(withdrawal.id, 'declined')}
                          >
                            Decline
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>All Withdrawal Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {withdrawals.map((withdrawal) => (
                    <div key={withdrawal.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium text-foreground">
                          {withdrawal.profiles?.full_name || withdrawal.profiles?.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ${withdrawal.amount.toFixed(2)} via {withdrawal.method}
                          {withdrawal.crypto_type && ` (${withdrawal.crypto_type.toUpperCase()})`}
                        </p>
                      </div>
                      <Badge className={cn(
                        withdrawal.status === 'completed' && 'bg-success/10 text-success',
                        withdrawal.status === 'pending' && 'bg-warning/10 text-warning',
                        withdrawal.status === 'declined' && 'bg-destructive/10 text-destructive',
                        withdrawal.status === 'approved' && 'bg-primary/10 text-primary'
                      )}>
                        {withdrawal.status.toUpperCase()}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            {/* TAMG Share Price */}
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  TAMG Share Price
                </CardTitle>
                <CardDescription>Set the current price per TAMIC GROUP share</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={adminSettings.tamg_share_price}
                      onChange={(e) => setAdminSettings({ ...adminSettings, tamg_share_price: e.target.value })}
                      className="pl-7"
                    />
                  </div>
                  <Button onClick={() => updateAdminSetting('tamg_share_price', adminSettings.tamg_share_price)}>
                    Update Price
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bank Deposit Settings</CardTitle>
                <CardDescription>Configure the bank account details shown to users for deposits</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Bank Name</label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={adminSettings.deposit_bank_name}
                      onChange={(e) => setAdminSettings({ ...adminSettings, deposit_bank_name: e.target.value })}
                    />
                    <Button onClick={() => updateAdminSetting('deposit_bank_name', adminSettings.deposit_bank_name)}>Save</Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Account Name</label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={adminSettings.deposit_bank_account_name}
                      onChange={(e) => setAdminSettings({ ...adminSettings, deposit_bank_account_name: e.target.value })}
                    />
                    <Button onClick={() => updateAdminSetting('deposit_bank_account_name', adminSettings.deposit_bank_account_name)}>Save</Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Account Number</label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={adminSettings.deposit_bank_account}
                      onChange={(e) => setAdminSettings({ ...adminSettings, deposit_bank_account: e.target.value })}
                    />
                    <Button onClick={() => updateAdminSetting('deposit_bank_account', adminSettings.deposit_bank_account)}>Save</Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Routing Number</label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={adminSettings.deposit_bank_routing}
                      onChange={(e) => setAdminSettings({ ...adminSettings, deposit_bank_routing: e.target.value })}
                    />
                    <Button onClick={() => updateAdminSetting('deposit_bank_routing', adminSettings.deposit_bank_routing)}>Save</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Crypto Deposit Addresses</CardTitle>
                <CardDescription>Configure cryptocurrency wallet addresses for deposits</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">BTC Address</label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={adminSettings.deposit_btc_address}
                      onChange={(e) => setAdminSettings({ ...adminSettings, deposit_btc_address: e.target.value })}
                      className="font-mono text-sm"
                    />
                    <Button onClick={() => updateAdminSetting('deposit_btc_address', adminSettings.deposit_btc_address)}>Save</Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">ETH Address (ERC20)</label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={adminSettings.deposit_eth_address}
                      onChange={(e) => setAdminSettings({ ...adminSettings, deposit_eth_address: e.target.value })}
                      className="font-mono text-sm"
                    />
                    <Button onClick={() => updateAdminSetting('deposit_eth_address', adminSettings.deposit_eth_address)}>Save</Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">USDT Address (TRC20)</label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={adminSettings.deposit_usdt_address}
                      onChange={(e) => setAdminSettings({ ...adminSettings, deposit_usdt_address: e.target.value })}
                      className="font-mono text-sm"
                    />
                    <Button onClick={() => updateAdminSetting('deposit_usdt_address', adminSettings.deposit_usdt_address)}>Save</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* KYC Details Dialog */}
        <Dialog open={showKYCDetailsDialog} onOpenChange={setShowKYCDetailsDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>KYC Application Details</DialogTitle>
              <DialogDescription>
                {selectedKYC?.account_type === 'individual' ? 'Individual' : 'Corporate'} Application
              </DialogDescription>
            </DialogHeader>
            {selectedKYC && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Name</p>
                    <p className="font-medium">{selectedKYC.account_type === 'individual' ? selectedKYC.full_name : selectedKYC.company_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedKYC.profiles?.email}</p>
                  </div>
                  {selectedKYC.phone && (
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="font-medium">{selectedKYC.phone}</p>
                    </div>
                  )}
                  {selectedKYC.date_of_birth && (
                    <div>
                      <p className="text-xs text-muted-foreground">Date of Birth</p>
                      <p className="font-medium">{new Date(selectedKYC.date_of_birth).toLocaleDateString()}</p>
                    </div>
                  )}
                  {selectedKYC.address && (
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">Address</p>
                      <p className="font-medium">{selectedKYC.address}, {selectedKYC.city}, {selectedKYC.state}, {selectedKYC.country}</p>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-3">Documents</p>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedKYC.id_document_url && (
                      <a href={selectedKYC.id_document_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="w-full gap-1">
                          <Eye className="h-3 w-3" /> ID Document
                        </Button>
                      </a>
                    )}
                    {selectedKYC.selfie_url && (
                      <a href={selectedKYC.selfie_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="w-full gap-1">
                          <Eye className="h-3 w-3" /> Selfie
                        </Button>
                      </a>
                    )}
                    {selectedKYC.cac_certificate_url && (
                      <a href={selectedKYC.cac_certificate_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="w-full gap-1">
                          <Eye className="h-3 w-3" /> CAC Certificate
                        </Button>
                      </a>
                    )}
                    {selectedKYC.board_resolution_url && (
                      <a href={selectedKYC.board_resolution_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="w-full gap-1">
                          <Eye className="h-3 w-3" /> Board Resolution
                        </Button>
                      </a>
                    )}
                    {selectedKYC.tax_clearance_url && (
                      <a href={selectedKYC.tax_clearance_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="w-full gap-1">
                          <Eye className="h-3 w-3" /> Tax Clearance
                        </Button>
                      </a>
                    )}
                  </div>
                </div>

                {selectedKYC.status === 'rejected' && selectedKYC.rejection_reason && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium text-destructive mb-1">Rejection Reason</p>
                    <p className="text-sm text-muted-foreground">{selectedKYC.rejection_reason}</p>
                  </div>
                )}

                {selectedKYC.status === 'pending' && (
                  <div className="flex gap-2 pt-4 border-t">
                    <Button className="flex-1 bg-success hover:bg-success/90" onClick={() => { handleApprove(selectedKYC.id); setShowKYCDetailsDialog(false); }}>
                      Approve Application
                    </Button>
                    <Button variant="destructive" className="flex-1" onClick={() => { setShowKYCDetailsDialog(false); setShowRejectDialog(true); }}>
                      Reject Application
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject KYC Application</DialogTitle>
              <DialogDescription>
                Provide a reason for rejection. This will be visible to the user.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              placeholder="Reason for rejection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleReject} disabled={!rejectionReason.trim()}>
                Reject Application
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* User Edit Dialog */}
        <Dialog open={showUserEditDialog} onOpenChange={setShowUserEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Manage User Funds</DialogTitle>
              <DialogDescription>
                {selectedUser?.full_name || selectedUser?.email}
              </DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Current Balance</p>
                  <p className="text-2xl font-bold text-foreground">
                    ${selectedUser.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant={fundAction === 'add' ? 'default' : 'outline'}
                    className="flex-1 gap-2"
                    onClick={() => setFundAction('add')}
                  >
                    <Plus className="h-4 w-4" />
                    Add Funds
                  </Button>
                  <Button
                    variant={fundAction === 'remove' ? 'default' : 'outline'}
                    className="flex-1 gap-2"
                    onClick={() => setFundAction('remove')}
                  >
                    <Minus className="h-4 w-4" />
                    Remove Funds
                  </Button>
                </div>

                <div>
                  <label className="text-sm font-medium">Amount (USD)</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUserEditDialog(false)}>Cancel</Button>
              <Button onClick={handleUpdateUserFunds} disabled={!fundAmount}>
                {fundAction === 'add' ? 'Add' : 'Remove'} Funds
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}