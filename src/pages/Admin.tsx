import { useState, useEffect } from 'react';
import { Users, FileCheck, Clock, XCircle, CheckCircle2, Eye, Search, DollarSign, Wallet, Settings2, Plus, Minus, ArrowDownToLine, TrendingUp, CreditCard, ShoppingCart, ArrowUpToLine, RefreshCw, MessageSquare } from 'lucide-react';
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
import { AdminSupportChat } from '@/components/admin/AdminSupportChat';
import { BTCAddressWithQRManager } from '@/components/admin/BTCAddressWithQRManager';

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
  from_tamic_wallet: boolean | null;
  profiles?: { 
    email: string; 
    full_name: string | null; 
    wallet_id: string | null;
    bank_name: string | null;
    bank_account_number: string | null;
    bank_account_name: string | null;
  } | null;
}

interface Transaction {
  id: string;
  user_id: string;
  type: string;
  method: string;
  amount: number;
  status: string;
  created_at: string;
  notes: string | null;
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
  deposit_btc_addresses: string;
  deposit_eth_addresses: string;
  deposit_usdt_addresses: string;
  deposit_btc_addresses_with_qr: string;
  tamg_share_price: string;
  min_shares_purchase: string;
}

export default function Admin() {
  const [kycRequests, setKycRequests] = useState<KYCRequestWithProfile[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [selectedKYC, setSelectedKYC] = useState<KYCRequestWithProfile | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showKYCDetailsDialog, setShowKYCDetailsDialog] = useState(false);
  const [showUserEditDialog, setShowUserEditDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [fundAmount, setFundAmount] = useState('');
  const [fundAction, setFundAction] = useState<'add' | 'remove'>('add');
  const [newWalletAddress, setNewWalletAddress] = useState({ btc: '', eth: '', usdt: '' });
  const [adminSettings, setAdminSettings] = useState<AdminSettings>({
    deposit_bank_name: '',
    deposit_bank_account: '',
    deposit_bank_routing: '',
    deposit_bank_account_name: '',
    deposit_btc_address: '',
    deposit_eth_address: '',
    deposit_usdt_address: '',
    deposit_btc_addresses: '[]',
    deposit_eth_addresses: '[]',
    deposit_usdt_addresses: '[]',
    deposit_btc_addresses_with_qr: '[]',
    tamg_share_price: '25.00',
    min_shares_purchase: '1',
  });
  const { toast } = useToast();

  const refreshAllData = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchData(),
      fetchUsers(),
      fetchAdminSettings(),
      fetchWithdrawals(),
      fetchTransactions()
    ]);
    setRefreshing(false);
    toast({ title: 'Refreshed', description: 'All data has been refreshed' });
  };

  useEffect(() => {
    fetchData();
    fetchUsers();
    fetchAdminSettings();
    fetchWithdrawals();
    fetchTransactions();
  }, []);

  const fetchData = async () => {
    console.log('Fetching KYC data...');
    const { data: kyc, error } = await supabase
      .from('kyc_requests')
      .select('*')
      .order('submitted_at', { ascending: false });

    console.log('KYC result:', { kyc, error });

    if (error) {
      console.error('KYC error:', error);
      toast({ title: 'Error fetching KYC', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    if (kyc && kyc.length > 0) {
      // Fetch profiles separately for each KYC request
      const kycWithProfiles = await Promise.all(
        kyc.map(async (k) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', k.user_id)
            .maybeSingle();
          return { ...k, profiles: profileData };
        })
      );
      setKycRequests(kycWithProfiles as unknown as KYCRequestWithProfile[]);
      
      const total = kyc.length;
      const pending = kyc.filter(k => k.status === 'pending').length;
      const approved = kyc.filter(k => k.status === 'approved').length;
      const rejected = kyc.filter(k => k.status === 'rejected').length;
      setStats({ total, pending, approved, rejected });
    } else {
      setKycRequests([]);
      setStats({ total: 0, pending: 0, approved: 0, rejected: 0 });
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
    console.log('Fetching withdrawals...');
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .order('created_at', { ascending: false });

    console.log('Withdrawals result:', { data, error });

    if (error) {
      console.error('Withdrawals error:', error);
      toast({ title: 'Error fetching withdrawals', description: error.message, variant: 'destructive' });
      return;
    }

    if (data && data.length > 0) {
      // Fetch profiles separately for each withdrawal
      const withdrawalsWithProfiles = await Promise.all(
        data.map(async (w) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('email, full_name, wallet_id, bank_name, bank_account_number, bank_account_name')
            .eq('id', w.user_id)
            .maybeSingle();
          return { ...w, profiles: profileData };
        })
      );
      setWithdrawals(withdrawalsWithProfiles as unknown as WithdrawalRequest[]);
    } else {
      setWithdrawals([]);
    }
  };

  const fetchTransactions = async () => {
    console.log('Fetching transactions...');
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    console.log('Transactions result:', { data, error });

    if (error) {
      console.error('Transactions error:', error);
      toast({ title: 'Error fetching transactions', description: error.message, variant: 'destructive' });
      return;
    }

    if (data && data.length > 0) {
      // Fetch profiles separately for each transaction
      const transactionsWithProfiles = await Promise.all(
        data.map(async (t) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('email, full_name, wallet_id')
            .eq('id', t.user_id)
            .maybeSingle();
          return { ...t, profiles: profileData };
        })
      );
      setTransactions(transactionsWithProfiles as unknown as Transaction[]);
    } else {
      setTransactions([]);
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

  const addWalletAddress = async (type: 'btc' | 'eth' | 'usdt') => {
    const addressKey = `deposit_${type}_addresses`;
    const newAddress = newWalletAddress[type].trim();
    
    if (!newAddress) {
      toast({ title: 'Error', description: 'Please enter a wallet address', variant: 'destructive' });
      return;
    }

    try {
      const currentAddresses = JSON.parse(adminSettings[addressKey as keyof AdminSettings] || '[]');
      const updatedAddresses = [...currentAddresses, newAddress];
      
      await updateAdminSetting(addressKey, JSON.stringify(updatedAddresses));
      setNewWalletAddress(prev => ({ ...prev, [type]: '' }));
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to add address', variant: 'destructive' });
    }
  };

  const removeWalletAddress = async (type: 'btc' | 'eth' | 'usdt', index: number) => {
    const addressKey = `deposit_${type}_addresses`;
    
    try {
      const currentAddresses = JSON.parse(adminSettings[addressKey as keyof AdminSettings] || '[]');
      currentAddresses.splice(index, 1);
      
      await updateAdminSetting(addressKey, JSON.stringify(currentAddresses));
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to remove address', variant: 'destructive' });
    }
  };

  const getWalletAddresses = (type: 'btc' | 'eth' | 'usdt'): string[] => {
    const addressKey = `deposit_${type}_addresses`;
    try {
      return JSON.parse(adminSettings[addressKey as keyof AdminSettings] || '[]');
    } catch {
      return [];
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

  const handleTransactionAction = async (id: string, status: 'completed' | 'failed') => {
    const { error } = await supabase
      .from('transactions')
      .update({ status })
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `Transaction marked as ${status}` });
      fetchTransactions();
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.wallet_id?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const pendingRequests = kycRequests.filter(k => k.status === 'pending');
  // Pending withdrawals: all pending ones that are NOT auto-completed TAMIC wallet transfers
  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending' && w.from_tamic_wallet !== true);
  // Auto-completed: completed ones that used TAMIC wallet
  const autoCompletedWithdrawals = withdrawals.filter(w => w.status === 'completed' && w.from_tamic_wallet === true);
  const pendingTransactions = transactions.filter(t => t.status === 'pending');
  const pendingDeposits = transactions.filter(t => t.type === 'deposit' && t.status === 'pending');

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-muted-foreground">
              Manage users, KYC applications, and platform settings
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshAllData}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            Refresh
          </Button>
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
            <TabsTrigger value="deposits" className="gap-2">
              <ArrowUpToLine className="h-4 w-4" />
              <span className="hidden sm:inline">Deposits</span>
              {pendingDeposits.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {pendingDeposits.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Payments</span>
              {pendingTransactions.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {pendingTransactions.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings2 className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
            <TabsTrigger value="support" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Support</span>
            </TabsTrigger>
          </TabsList>

          {/* KYC Tab */}
          <TabsContent value="kyc" className="space-y-6">
            {/* Stats */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              <Card className="min-w-0">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Total Applications</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </CardHeader>
                <CardContent>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.total}</p>
                </CardContent>
              </Card>

              <Card className="min-w-0">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Pending</CardTitle>
                  <Clock className="h-4 w-4 text-warning flex-shrink-0" />
                </CardHeader>
                <CardContent>
                  <p className="text-xl sm:text-2xl font-bold text-warning">{stats.pending}</p>
                </CardContent>
              </Card>

              <Card className="min-w-0">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Approved</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                </CardHeader>
                <CardContent>
                  <p className="text-xl sm:text-2xl font-bold text-success">{stats.approved}</p>
                </CardContent>
              </Card>

              <Card className="min-w-0">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Rejected</CardTitle>
                  <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                </CardHeader>
                <CardContent>
                  <p className="text-xl sm:text-2xl font-bold text-destructive">{stats.rejected}</p>
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
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-foreground truncate">
                              {kyc.account_type === 'individual' ? kyc.full_name : kyc.company_name}
                            </p>
                            <Badge variant="secondary" className="flex-shrink-0">
                              {kyc.account_type === 'individual' ? 'Individual' : 'Corporate'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{kyc.profiles?.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Submitted: {new Date(kyc.submitted_at).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2 flex-shrink-0">
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
                    <div key={kyc.id} className="flex items-center justify-between p-3 rounded-lg border gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-foreground truncate">
                            {kyc.account_type === 'individual' ? kyc.full_name : kyc.company_name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{kyc.profiles?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
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
                    <div key={user.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground truncate">{user.full_name || 'N/A'}</p>
                        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                        <div className="flex items-center gap-4 mt-1 flex-wrap">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Wallet className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate max-w-[100px]">{user.wallet_id || 'No wallet'}</span>
                          </span>
                          <span className="text-xs font-medium text-success flex items-center gap-1">
                            <DollarSign className="h-3 w-3 flex-shrink-0" />
                            ${user.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-shrink-0"
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
            {/* Auto-Completed TAMIC Wallet Withdrawals */}
            <Card className="border-success/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-success">
                  <CheckCircle2 className="h-5 w-5" />
                  Auto-Completed TAMIC Wallet Transfers
                </CardTitle>
                <CardDescription>These withdrawals were automatically transferred to user's TAMIC wallet</CardDescription>
              </CardHeader>
              <CardContent>
                {autoCompletedWithdrawals.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No auto-completed transfers</p>
                ) : (
                  <div className="space-y-3">
                    {autoCompletedWithdrawals.slice(0, 10).map((withdrawal) => (
                      <div key={withdrawal.id} className="flex items-center justify-between p-3 rounded-lg border border-success/20 bg-success/5 gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-foreground truncate">
                            {withdrawal.profiles?.full_name || withdrawal.profiles?.email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ${withdrawal.amount.toFixed(2)} {withdrawal.crypto_type?.toUpperCase()} auto-transferred to TAMIC wallet
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(withdrawal.created_at).toLocaleString()}
                          </p>
                        </div>
                        <Badge className="bg-success/10 text-success flex-shrink-0">
                          AUTO-COMPLETED
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pending Manual Withdrawals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-warning" />
                  Pending Withdrawals (Manual Processing Required)
                </CardTitle>
                <CardDescription>Bank transfers and external crypto wallet withdrawals that need manual processing</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingWithdrawals.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No pending withdrawals</p>
                ) : (
                  <div className="space-y-4">
                    {pendingWithdrawals.map((withdrawal) => (
                      <div key={withdrawal.id} className="p-4 rounded-lg border border-warning/20">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-foreground truncate">
                              {withdrawal.profiles?.full_name || withdrawal.profiles?.email}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">{withdrawal.profiles?.email}</p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <Badge variant="outline">{withdrawal.method.toUpperCase()}</Badge>
                              {withdrawal.crypto_type && (
                                <Badge variant="secondary">{withdrawal.crypto_type.toUpperCase()}</Badge>
                              )}
                              <Badge variant="destructive" className="text-xs">REQUIRES ACTION</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              User Wallet ID: {withdrawal.profiles?.wallet_id || 'N/A'}
                            </p>
                            
                            {/* Bank Details for bank withdrawals */}
                            {withdrawal.method === 'bank' && (
                              <div className="mt-2 p-2 bg-muted/50 rounded text-xs space-y-1">
                                <p className="font-medium text-foreground">Bank Details:</p>
                                <p className="text-muted-foreground">Bank: {withdrawal.profiles?.bank_name || 'N/A'}</p>
                                <p className="text-muted-foreground">Account Name: {withdrawal.profiles?.bank_account_name || 'N/A'}</p>
                                <p className="font-mono text-muted-foreground">Account #: {withdrawal.profiles?.bank_account_number || 'N/A'}</p>
                              </div>
                            )}
                            
                            {/* Crypto address for crypto withdrawals */}
                            {withdrawal.method === 'crypto' && withdrawal.wallet_address && (
                              <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                                <p className="font-medium text-foreground">Send {withdrawal.crypto_type?.toUpperCase()} to:</p>
                                <p className="font-mono text-muted-foreground break-all">{withdrawal.wallet_address}</p>
                              </div>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xl font-bold text-foreground">
                              ${withdrawal.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(withdrawal.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4 flex-wrap">
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
                    <div key={withdrawal.id} className="flex items-center justify-between p-3 rounded-lg border gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground truncate">
                          {withdrawal.profiles?.full_name || withdrawal.profiles?.email}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          ${withdrawal.amount.toFixed(2)} via {withdrawal.method}
                          {withdrawal.crypto_type && ` (${withdrawal.crypto_type.toUpperCase()})`}
                        </p>
                      </div>
                      <Badge className={cn(
                        'flex-shrink-0',
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

          {/* Deposits Tab */}
          <TabsContent value="deposits" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowUpToLine className="h-5 w-5 text-success" />
                  Pending Deposit Requests
                </CardTitle>
                <CardDescription>
                  Review user deposits. Look for their Wallet ID (e.g., TG-XXXXXXXX) in your bank or crypto transaction reference to verify payment.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingDeposits.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No pending deposits</p>
                ) : (
                  <div className="space-y-4">
                    {pendingDeposits.map((deposit) => (
                      <div key={deposit.id} className="p-4 rounded-lg border border-success/20">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-foreground truncate">
                              {deposit.profiles?.full_name || deposit.profiles?.email}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">{deposit.profiles?.email}</p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <Badge variant="outline">{deposit.type.toUpperCase()}</Badge>
                              {deposit.method && <Badge variant="secondary">{deposit.method.toUpperCase()}</Badge>}
                            </div>
                            {deposit.notes && (
                              <p className="text-xs text-muted-foreground mt-2 break-all">
                                Notes: {deposit.notes}
                              </p>
                            )}
                            <div className="mt-2 p-2 bg-primary/5 border border-primary/20 rounded text-xs space-y-1">
                              <p className="font-medium text-foreground">User Wallet ID:</p>
                              <p className="font-mono font-bold text-primary">{deposit.profiles?.wallet_id || 'N/A'}</p>
                              <p className="text-muted-foreground text-[10px]">Search for this ID in your bank/crypto transactions to verify payment</p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xl font-bold text-foreground">
                              ${deposit.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(deposit.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4 flex-wrap">
                          <Button 
                            size="sm" 
                            className="bg-success hover:bg-success/90"
                            onClick={() => handleTransactionAction(deposit.id, 'completed')}
                          >
                            Confirm & Credit User
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleTransactionAction(deposit.id, 'failed')}
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
                <CardTitle>All Deposit History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {transactions.filter(t => t.type === 'deposit').map((deposit) => (
                    <div key={deposit.id} className="flex items-center justify-between p-3 rounded-lg border gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground truncate">
                          {deposit.profiles?.full_name || deposit.profiles?.email}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          ${deposit.amount.toFixed(2)} - {deposit.method || 'Unknown method'}
                        </p>
                      </div>
                      <Badge className={cn(
                        'flex-shrink-0',
                        deposit.status === 'completed' && 'bg-success/10 text-success',
                        deposit.status === 'pending' && 'bg-warning/10 text-warning',
                        deposit.status === 'failed' && 'bg-destructive/10 text-destructive'
                      )}>
                        {deposit.status.toUpperCase()}
                      </Badge>
                    </div>
                  ))}
                  {transactions.filter(t => t.type === 'deposit').length === 0 && (
                    <p className="text-center text-muted-foreground py-4">No deposit history</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Pending Payments & Purchases
                </CardTitle>
                <CardDescription>Review user payments for crypto, stocks, and other purchases</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingTransactions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No pending payments</p>
                ) : (
                  <div className="space-y-4">
                    {pendingTransactions.map((transaction) => (
                      <div key={transaction.id} className="p-4 rounded-lg border">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-foreground truncate">
                              {transaction.profiles?.full_name || transaction.profiles?.email}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">{transaction.profiles?.email}</p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <Badge variant="outline">{transaction.type.toUpperCase()}</Badge>
                              <Badge variant="secondary">{transaction.method.toUpperCase()}</Badge>
                            </div>
                            {transaction.notes && (
                              <p className="text-xs text-muted-foreground mt-1 break-all">
                                Notes: {transaction.notes}
                              </p>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xl font-bold text-foreground">
                              ${transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(transaction.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4 flex-wrap">
                          <Button 
                            size="sm" 
                            className="bg-success hover:bg-success/90"
                            onClick={() => handleTransactionAction(transaction.id, 'completed')}
                          >
                            Mark Completed
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleTransactionAction(transaction.id, 'failed')}
                          >
                            Mark Failed
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
                <CardTitle>All Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg border gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground truncate">
                          {transaction.profiles?.full_name || transaction.profiles?.email}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          ${transaction.amount.toFixed(2)} - {transaction.type} ({transaction.method})
                        </p>
                      </div>
                      <Badge className={cn(
                        'flex-shrink-0',
                        transaction.status === 'completed' && 'bg-success/10 text-success',
                        transaction.status === 'pending' && 'bg-warning/10 text-warning',
                        transaction.status === 'failed' && 'bg-destructive/10 text-destructive'
                      )}>
                        {transaction.status.toUpperCase()}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            {/* TAMG Share Settings */}
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  TAMG Share Settings
                </CardTitle>
                <CardDescription>Configure TAMIC GROUP share price and purchase limits</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Share Price (USD)</label>
                  <div className="flex gap-2 mt-1">
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
                      Update
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Minimum Shares Purchase</label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="number"
                      step="1"
                      min="1"
                      value={adminSettings.min_shares_purchase}
                      onChange={(e) => setAdminSettings({ ...adminSettings, min_shares_purchase: e.target.value })}
                      placeholder="1"
                    />
                    <Button onClick={() => updateAdminSetting('min_shares_purchase', adminSettings.min_shares_purchase)}>
                      Update
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Users must purchase at least this many shares</p>
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
                <CardDescription>Configure cryptocurrency wallet addresses for deposits. Add multiple addresses per network for random selection.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* BTC Addresses with QR Codes */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">BTC Addresses with QR Codes (Optional)</label>
                  <p className="text-xs text-muted-foreground">Add BTC addresses paired with QR code images. QR codes are optional.</p>
                  <BTCAddressWithQRManager 
                    adminSettings={adminSettings}
                    updateAdminSetting={updateAdminSetting}
                    fetchAdminSettings={fetchAdminSettings}
                  />
                </div>

                {/* BTC Addresses (without QR) */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">BTC Addresses (No QR Code)</label>
                  <div className="space-y-2">
                    {getWalletAddresses('btc').map((addr, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <Input value={addr} readOnly className="font-mono text-xs flex-1" />
                        <Button variant="destructive" size="sm" onClick={() => removeWalletAddress('btc', idx)}>
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add new BTC address..."
                      value={newWalletAddress.btc}
                      onChange={(e) => setNewWalletAddress(prev => ({ ...prev, btc: e.target.value }))}
                      className="font-mono text-sm flex-1"
                    />
                    <Button onClick={() => addWalletAddress('btc')} className="gap-1">
                      <Plus className="h-4 w-4" /> Add
                    </Button>
                  </div>
                </div>

                {/* ETH Addresses */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">ETH Addresses (ERC20)</label>
                  <div className="space-y-2">
                    {getWalletAddresses('eth').map((addr, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <Input value={addr} readOnly className="font-mono text-xs flex-1" />
                        <Button variant="destructive" size="sm" onClick={() => removeWalletAddress('eth', idx)}>
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add new ETH address..."
                      value={newWalletAddress.eth}
                      onChange={(e) => setNewWalletAddress(prev => ({ ...prev, eth: e.target.value }))}
                      className="font-mono text-sm flex-1"
                    />
                    <Button onClick={() => addWalletAddress('eth')} className="gap-1">
                      <Plus className="h-4 w-4" /> Add
                    </Button>
                  </div>
                </div>

                {/* USDT Addresses */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">USDT Addresses (TRC20)</label>
                  <div className="space-y-2">
                    {getWalletAddresses('usdt').map((addr, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <Input value={addr} readOnly className="font-mono text-xs flex-1" />
                        <Button variant="destructive" size="sm" onClick={() => removeWalletAddress('usdt', idx)}>
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add new USDT address..."
                      value={newWalletAddress.usdt}
                      onChange={(e) => setNewWalletAddress(prev => ({ ...prev, usdt: e.target.value }))}
                      className="font-mono text-sm flex-1"
                    />
                    <Button onClick={() => addWalletAddress('usdt')} className="gap-1">
                      <Plus className="h-4 w-4" /> Add
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Support Tab */}
          <TabsContent value="support">
            <AdminSupportChat />
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Name</p>
                    <p className="font-medium break-words">{selectedKYC.account_type === 'individual' ? selectedKYC.full_name : selectedKYC.company_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium break-all">{selectedKYC.profiles?.email}</p>
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
                    <div className="col-span-1 sm:col-span-2">
                      <p className="text-xs text-muted-foreground">Address</p>
                      <p className="font-medium break-words">{selectedKYC.address}, {selectedKYC.city}, {selectedKYC.state}, {selectedKYC.country}</p>
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
                  <div className="flex gap-2 pt-4 border-t flex-wrap">
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
