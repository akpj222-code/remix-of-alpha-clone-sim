import { useState } from 'react';
import { CheckCircle2, Clock, XCircle, FileText, User, Building2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from '@/components/layout/AppLayout';
import { IndividualKYCForm } from '@/components/kyc/IndividualKYCForm';
import { CorporateKYCForm } from '@/components/kyc/CorporateKYCForm';
import { useKYC, KYCStatus } from '@/hooks/useKYC';
import { cn } from '@/lib/utils';

const statusConfig: Record<KYCStatus, { icon: any; label: string; color: string; description: string }> = {
  not_started: {
    icon: FileText,
    label: 'Not Started',
    color: 'text-muted-foreground',
    description: 'Complete your KYC verification to unlock all trading features',
  },
  pending: {
    icon: Clock,
    label: 'Pending Review',
    color: 'text-warning',
    description: 'Your application is being reviewed. This usually takes 1-2 business days.',
  },
  approved: {
    icon: CheckCircle2,
    label: 'Approved',
    color: 'text-success',
    description: 'Your identity has been verified. You have full access to all trading features.',
  },
  rejected: {
    icon: XCircle,
    label: 'Rejected',
    color: 'text-destructive',
    description: 'Your application was not approved. Please review the reason and resubmit.',
  },
};

type AccountType = 'individual' | 'corporate' | null;

export default function KYC() {
  const { kycRequest, loading } = useKYC();
  const [accountType, setAccountType] = useState<AccountType>(null);

  const status: KYCStatus = kycRequest?.status || 'not_started';
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AppLayout>
    );
  }

  // Show status if KYC already submitted
  if (kycRequest && status !== 'not_started') {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold text-foreground">KYC Verification</h1>
            <p className="text-muted-foreground">
              Know Your Customer verification status
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center py-8">
                <div className={cn(
                  "flex h-16 w-16 items-center justify-center rounded-full mb-4",
                  status === 'approved' && "bg-success/10",
                  status === 'pending' && "bg-warning/10",
                  status === 'rejected' && "bg-destructive/10"
                )}>
                  <StatusIcon className={cn("h-8 w-8", config.color)} />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  {config.label}
                </h2>
                <p className="text-muted-foreground max-w-md">
                  {config.description}
                </p>

                {status === 'rejected' && kycRequest.rejection_reason && (
                  <div className="mt-4 p-4 bg-destructive/10 rounded-lg">
                    <p className="text-sm text-destructive font-medium">
                      Reason: {kycRequest.rejection_reason}
                    </p>
                  </div>
                )}

                {status === 'rejected' && (
                  <Button className="mt-6" onClick={() => window.location.reload()}>
                    Submit New Application
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Application Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Application Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account Type</span>
                  <Badge variant="secondary">
                    {kycRequest.account_type === 'individual' ? 'Individual' : 'Corporate'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Submitted</span>
                  <span>{new Date(kycRequest.submitted_at).toLocaleDateString()}</span>
                </div>
                {kycRequest.reviewed_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reviewed</span>
                    <span>{new Date(kycRequest.reviewed_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // Account type selection
  if (!accountType) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold text-foreground">KYC Verification</h1>
            <p className="text-muted-foreground">
              Select your account type to begin verification
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card 
              className="cursor-pointer transition-all hover:border-primary hover:shadow-md"
              onClick={() => setAccountType('individual')}
            >
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-4">
                    <User className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">Individual</h3>
                  <p className="text-sm text-muted-foreground">
                    For personal investment accounts
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer transition-all hover:border-primary hover:shadow-md"
              onClick={() => setAccountType('corporate')}
            >
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-4">
                    <Building2 className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">Corporate</h3>
                  <p className="text-sm text-muted-foreground">
                    For business and institutional accounts
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AppLayout>
    );
  }

  // KYC Forms
  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">KYC Verification</h1>
            <p className="text-muted-foreground">
              {accountType === 'individual' ? 'Individual' : 'Corporate'} Account
            </p>
          </div>
          <Button variant="ghost" onClick={() => setAccountType(null)}>
            Change Type
          </Button>
        </div>

        {accountType === 'individual' ? (
          <IndividualKYCForm />
        ) : (
          <CorporateKYCForm />
        )}
      </div>
    </AppLayout>
  );
}