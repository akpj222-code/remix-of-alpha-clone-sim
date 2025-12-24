import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Upload, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useKYC } from '@/hooks/useKYC';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const personalInfoSchema = z.object({
  full_name: z.string().min(2, 'Full name is required'),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  chn: z.string().optional(),
});

const addressSchema = z.object({
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  country: z.string().min(2, 'Country is required'),
  employment_status: z.string().min(1, 'Employment status is required'),
  annual_income: z.string().min(1, 'Annual income is required'),
});

type Step = 1 | 2 | 3 | 4;

export function IndividualKYCForm() {
  const [step, setStep] = useState<Step>(1);
  const [personalInfo, setPersonalInfo] = useState<z.infer<typeof personalInfoSchema> | null>(null);
  const [addressInfo, setAddressInfo] = useState<z.infer<typeof addressSchema> | null>(null);
  const [idDocument, setIdDocument] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { submitKYC, uploadDocument } = useKYC();
  const { toast } = useToast();

  const personalForm = useForm({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: personalInfo || { full_name: '', date_of_birth: '', phone: '', chn: '' },
  });

  const addressForm = useForm({
    resolver: zodResolver(addressSchema),
    defaultValues: addressInfo || { address: '', city: '', state: '', country: '', employment_status: '', annual_income: '' },
  });

  const handlePersonalSubmit = (data: z.infer<typeof personalInfoSchema>) => {
    setPersonalInfo(data);
    setStep(2);
  };

  const handleAddressSubmit = (data: z.infer<typeof addressSchema>) => {
    setAddressInfo(data);
    setStep(3);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'id' | 'selfie') => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'id') setIdDocument(file);
      else setSelfie(file);
    }
  };

  const handleFinalSubmit = async () => {
    if (!personalInfo || !addressInfo || !idDocument || !selfie) {
      toast({ title: 'Error', description: 'Please complete all steps', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload documents
      const { url: idUrl, error: idError } = await uploadDocument(idDocument, 'id-document');
      if (idError) throw idError;

      const { url: selfieUrl, error: selfieError } = await uploadDocument(selfie, 'selfie');
      if (selfieError) throw selfieError;

      // Submit KYC
      const { error } = await submitKYC({
        account_type: 'individual',
        ...personalInfo,
        ...addressInfo,
        id_document_url: idUrl,
        selfie_url: selfieUrl,
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
    { num: 1, label: 'Personal Info' },
    { num: 2, label: 'Address' },
    { num: 3, label: 'Documents' },
    { num: 4, label: 'Photo' },
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
                "mx-2 h-0.5 w-8 sm:w-16",
                step > s.num ? "bg-primary" : "bg-muted"
              )} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Personal Info */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...personalForm}>
              <form onSubmit={personalForm.handleSubmit(handlePersonalSubmit)} className="space-y-4">
                <FormField
                  control={personalForm.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name (as on ID)</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={personalForm.control}
                  name="date_of_birth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={personalForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 234 567 8900" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={personalForm.control}
                  name="chn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CHN (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Clearing House Number" {...field} />
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

      {/* Step 2: Address & Employment */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Address & Employment</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...addressForm}>
              <form onSubmit={addressForm.handleSubmit(handleAddressSubmit)} className="space-y-4">
                <FormField
                  control={addressForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main Street" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={addressForm.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="New York" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addressForm.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input placeholder="NY" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={addressForm.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="United States" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addressForm.control}
                  name="employment_status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employment Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="employed">Employed</SelectItem>
                          <SelectItem value="self-employed">Self-Employed</SelectItem>
                          <SelectItem value="retired">Retired</SelectItem>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="unemployed">Unemployed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addressForm.control}
                  name="annual_income"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Annual Income</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select range" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0-25000">$0 - $25,000</SelectItem>
                          <SelectItem value="25000-50000">$25,000 - $50,000</SelectItem>
                          <SelectItem value="50000-100000">$50,000 - $100,000</SelectItem>
                          <SelectItem value="100000-250000">$100,000 - $250,000</SelectItem>
                          <SelectItem value="250000+">$250,000+</SelectItem>
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

      {/* Step 3: Document Upload */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Identity Document</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Upload a clear photo of your government-issued ID (Passport, Driver's License, or National ID)
            </p>
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleFileChange(e, 'id')}
                className="hidden"
                id="id-upload"
              />
              <label htmlFor="id-upload" className="cursor-pointer">
                {idDocument ? (
                  <div className="flex items-center justify-center gap-2 text-success">
                    <CheckCircle2 className="h-6 w-6" />
                    <span>{idDocument.name}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Upload className="h-8 w-8" />
                    <span>Click to upload or drag and drop</span>
                    <span className="text-xs">PNG, JPG, or PDF up to 10MB</span>
                  </div>
                )}
              </label>
            </div>
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                Back
              </Button>
              <Button onClick={() => setStep(4)} disabled={!idDocument} className="flex-1">
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Selfie */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Photo Verification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Take a clear selfie holding your ID document next to your face
            </p>
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <input
                type="file"
                accept="image/*"
                capture="user"
                onChange={(e) => handleFileChange(e, 'selfie')}
                className="hidden"
                id="selfie-upload"
              />
              <label htmlFor="selfie-upload" className="cursor-pointer">
                {selfie ? (
                  <div className="flex items-center justify-center gap-2 text-success">
                    <CheckCircle2 className="h-6 w-6" />
                    <span>{selfie.name}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Upload className="h-8 w-8" />
                    <span>Click to take photo or upload</span>
                  </div>
                )}
              </label>
            </div>
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
                Back
              </Button>
              <Button onClick={handleFinalSubmit} disabled={!selfie || isSubmitting} className="flex-1">
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