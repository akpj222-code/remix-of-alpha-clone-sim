import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Upload, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useKYC } from '@/hooks/useKYC';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const companyInfoSchema = z.object({
  company_name: z.string().min(2, 'Company name is required'),
  incorporation_date: z.string().min(1, 'Incorporation date is required'),
  signatory_name: z.string().min(2, 'Signatory name is required'),
});

const companyDetailsSchema = z.object({
  business_address: z.string().min(5, 'Business address is required'),
  business_nature: z.string().min(1, 'Business nature is required'),
  annual_turnover: z.string().min(1, 'Annual turnover is required'),
});

type Step = 1 | 2 | 3;

export function CorporateKYCForm() {
  const [step, setStep] = useState<Step>(1);
  const [companyInfo, setCompanyInfo] = useState<z.infer<typeof companyInfoSchema> | null>(null);
  const [companyDetails, setCompanyDetails] = useState<z.infer<typeof companyDetailsSchema> | null>(null);
  const [cacCertificate, setCacCertificate] = useState<File | null>(null);
  const [boardResolution, setBoardResolution] = useState<File | null>(null);
  const [taxClearance, setTaxClearance] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { submitKYC, uploadDocument } = useKYC();
  const { toast } = useToast();

  const companyInfoForm = useForm({
    resolver: zodResolver(companyInfoSchema),
    defaultValues: companyInfo || { company_name: '', incorporation_date: '', signatory_name: '' },
  });

  const companyDetailsForm = useForm({
    resolver: zodResolver(companyDetailsSchema),
    defaultValues: companyDetails || { business_address: '', business_nature: '', annual_turnover: '' },
  });

  const handleCompanyInfoSubmit = (data: z.infer<typeof companyInfoSchema>) => {
    setCompanyInfo(data);
    setStep(2);
  };

  const handleCompanyDetailsSubmit = (data: z.infer<typeof companyDetailsSchema>) => {
    setCompanyDetails(data);
    setStep(3);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'cac' | 'board' | 'tax') => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'cac') setCacCertificate(file);
      else if (type === 'board') setBoardResolution(file);
      else setTaxClearance(file);
    }
  };

  const handleFinalSubmit = async () => {
    if (!companyInfo || !companyDetails || !cacCertificate || !boardResolution) {
      toast({ title: 'Error', description: 'Please complete all required steps', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload documents
      const { url: cacUrl, error: cacError } = await uploadDocument(cacCertificate, 'cac-certificate');
      if (cacError) throw cacError;

      const { url: boardUrl, error: boardError } = await uploadDocument(boardResolution, 'board-resolution');
      if (boardError) throw boardError;

      let taxUrl = null;
      if (taxClearance) {
        const { url, error } = await uploadDocument(taxClearance, 'tax-clearance');
        if (error) throw error;
        taxUrl = url;
      }

      // Submit KYC
      const { error } = await submitKYC({
        account_type: 'corporate',
        ...companyInfo,
        ...companyDetails,
        cac_certificate_url: cacUrl,
        board_resolution_url: boardUrl,
        tax_clearance_url: taxUrl,
      });

      if (error) throw error;

      toast({ title: 'Success', description: 'KYC application submitted successfully' });
      // Use navigation instead of reload to avoid 404 on Vercel
      window.location.href = '/kyc';
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { num: 1, label: 'Company Info' },
    { num: 2, label: 'Details' },
    { num: 3, label: 'Documents' },
  ];

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center">
            <div className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
              step >= s.num ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              {step > s.num ? <CheckCircle2 className="h-5 w-5" /> : s.num}
            </div>
            <span className={cn(
              "ml-2 text-sm hidden sm:inline",
              step >= s.num ? "text-foreground" : "text-muted-foreground"
            )}>
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <div className={cn(
                "mx-2 h-0.5 w-12 sm:w-24",
                step > s.num ? "bg-primary" : "bg-muted"
              )} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Company Info */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...companyInfoForm}>
              <form onSubmit={companyInfoForm.handleSubmit(handleCompanyInfoSubmit)} className="space-y-4">
                <FormField
                  control={companyInfoForm.control}
                  name="company_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Corporation Ltd" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={companyInfoForm.control}
                  name="incorporation_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Incorporation</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={companyInfoForm.control}
                  name="signatory_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Authorized Signatory Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">Continue</Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Company Details */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Business Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...companyDetailsForm}>
              <form onSubmit={companyDetailsForm.handleSubmit(handleCompanyDetailsSubmit)} className="space-y-4">
                <FormField
                  control={companyDetailsForm.control}
                  name="business_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Business Avenue, City" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={companyDetailsForm.control}
                  name="business_nature"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nature of Business</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select business type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="manufacturing">Manufacturing</SelectItem>
                          <SelectItem value="services">Services</SelectItem>
                          <SelectItem value="trading">Trading</SelectItem>
                          <SelectItem value="technology">Technology</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                          <SelectItem value="real-estate">Real Estate</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={companyDetailsForm.control}
                  name="annual_turnover"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Annual Turnover</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select range" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0-100000">$0 - $100,000</SelectItem>
                          <SelectItem value="100000-500000">$100,000 - $500,000</SelectItem>
                          <SelectItem value="500000-1000000">$500,000 - $1,000,000</SelectItem>
                          <SelectItem value="1000000-5000000">$1,000,000 - $5,000,000</SelectItem>
                          <SelectItem value="5000000+">$5,000,000+</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-4">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                    Back
                  </Button>
                  <Button type="submit" className="flex-1">Continue</Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Documents */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Corporate Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* CAC Certificate */}
            <div className="space-y-2">
              <label className="text-sm font-medium">CAC Certificate *</label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileChange(e, 'cac')}
                  className="hidden"
                  id="cac-upload"
                />
                <label htmlFor="cac-upload" className="cursor-pointer">
                  {cacCertificate ? (
                    <div className="flex items-center justify-center gap-2 text-success">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="text-sm">{cacCertificate.name}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                      <Upload className="h-6 w-6" />
                      <span className="text-sm">Upload CAC Certificate</span>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Board Resolution */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Board Resolution *</label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileChange(e, 'board')}
                  className="hidden"
                  id="board-upload"
                />
                <label htmlFor="board-upload" className="cursor-pointer">
                  {boardResolution ? (
                    <div className="flex items-center justify-center gap-2 text-success">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="text-sm">{boardResolution.name}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                      <Upload className="h-6 w-6" />
                      <span className="text-sm">Upload Board Resolution</span>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Tax Clearance */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tax Clearance Certificate (Optional)</label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileChange(e, 'tax')}
                  className="hidden"
                  id="tax-upload"
                />
                <label htmlFor="tax-upload" className="cursor-pointer">
                  {taxClearance ? (
                    <div className="flex items-center justify-center gap-2 text-success">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="text-sm">{taxClearance.name}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                      <Upload className="h-6 w-6" />
                      <span className="text-sm">Upload Tax Clearance</span>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                Back
              </Button>
              <Button 
                onClick={handleFinalSubmit} 
                disabled={!cacCertificate || !boardResolution || isSubmitting} 
                className="flex-1"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Application
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}