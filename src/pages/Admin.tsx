import { useState, useEffect } from 'react';
import { Users, FileCheck, Clock, XCircle, CheckCircle2, Eye, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  profiles: { email: string } | null;
}

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export default function Admin() {
  const [kycRequests, setKycRequests] = useState<KYCRequestWithProfile[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [selectedKYC, setSelectedKYC] = useState<KYCRequestWithProfile | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // Fetch KYC requests with profiles
    const { data: kyc, error } = await supabase
      .from('kyc_requests')
      .select(`
        *,
        profiles:user_id (email)
      `)
      .order('submitted_at', { ascending: false });

    if (!error && kyc) {
      setKycRequests(kyc as unknown as KYCRequestWithProfile[]);
      
      // Calculate stats
      const total = kyc.length;
      const pending = kyc.filter(k => k.status === 'pending').length;
      const approved = kyc.filter(k => k.status === 'approved').length;
      const rejected = kyc.filter(k => k.status === 'rejected').length;
      setStats({ total, pending, approved, rejected });
    }
    
    setLoading(false);
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

  const getDocumentUrl = (url: string | null) => {
    if (!url) return null;
    return url;
  };

  const pendingRequests = kycRequests.filter(k => k.status === 'pending');

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
          <p className="text-muted-foreground">
            Manage KYC applications and users
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Applications
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Review
              </CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-warning">{stats.pending}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Approved
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-success">{stats.approved}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Rejected
              </CardTitle>
              <XCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-destructive">{stats.rejected}</p>
            </CardContent>
          </Card>
        </div>

        {/* Pending KYC Queue */}
        <Card>
          <CardHeader>
            <CardTitle>Pending KYC Applications</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingRequests.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No pending applications
              </p>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((kyc) => (
                  <div
                    key={kyc.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">
                          {kyc.account_type === 'individual' 
                            ? kyc.full_name 
                            : kyc.company_name}
                        </p>
                        <Badge variant="secondary">
                          {kyc.account_type === 'individual' ? 'Individual' : 'Corporate'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {kyc.profiles?.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Submitted: {new Date(kyc.submitted_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {/* Document Links */}
                      {kyc.id_document_url && (
                        <a href={getDocumentUrl(kyc.id_document_url)!} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm" className="gap-1">
                            <Eye className="h-3 w-3" /> ID
                          </Button>
                        </a>
                      )}
                      {kyc.selfie_url && (
                        <a href={getDocumentUrl(kyc.selfie_url)!} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm" className="gap-1">
                            <Eye className="h-3 w-3" /> Selfie
                          </Button>
                        </a>
                      )}
                      {kyc.cac_certificate_url && (
                        <a href={getDocumentUrl(kyc.cac_certificate_url)!} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm" className="gap-1">
                            <Eye className="h-3 w-3" /> CAC
                          </Button>
                        </a>
                      )}
                      {kyc.board_resolution_url && (
                        <a href={getDocumentUrl(kyc.board_resolution_url)!} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm" className="gap-1">
                            <Eye className="h-3 w-3" /> Board Res
                          </Button>
                        </a>
                      )}

                      <Button 
                        size="sm" 
                        className="bg-success hover:bg-success/90"
                        onClick={() => handleApprove(kyc.id)}
                      >
                        Approve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => {
                          setSelectedKYC(kyc);
                          setShowRejectDialog(true);
                        }}
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
                <div
                  key={kyc.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {kyc.account_type === 'individual' 
                        ? kyc.full_name 
                        : kyc.company_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {kyc.profiles?.email}
                    </p>
                  </div>
                  <Badge className={cn(
                    kyc.status === 'approved' && 'bg-success/10 text-success',
                    kyc.status === 'pending' && 'bg-warning/10 text-warning',
                    kyc.status === 'rejected' && 'bg-destructive/10 text-destructive'
                  )}>
                    {kyc.status.toUpperCase()}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Reject Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject KYC Application</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Please provide a reason for rejection. This will be shown to the user.
              </p>
              <Textarea
                placeholder="Reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleReject}
                disabled={!rejectionReason.trim()}
              >
                Reject Application
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}