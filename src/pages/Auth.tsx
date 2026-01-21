import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, User, Building2, ChevronLeft, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signUpSchema = signInSchema.extend({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  phone: z.string().optional(),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignInValues = z.infer<typeof signInSchema>;
type SignUpValues = z.infer<typeof signUpSchema>;
type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(searchParams.get('mode') === 'signup');
  const [step, setStep] = useState<'type-selection' | 'form'>('type-selection');
  const [accountType, setAccountType] = useState<'individual' | 'corporate'>('individual');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<'signin' | 'signup' | 'forgot-password' | 'reset-password'>('signin');
  
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if this is a password reset callback
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    if (type === 'recovery') {
      setView('reset-password');
    }
  }, []);

  useEffect(() => {
    if (user && view !== 'reset-password') {
      navigate('/dashboard');
    }
  }, [user, navigate, view]);

  useEffect(() => {
    if (searchParams.get('mode') === 'signup') {
      setView('signup');
      setIsSignUp(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isSignUp) {
      setStep('form');
    } else {
      setStep('type-selection');
    }
  }, [isSignUp]);

  const signInForm = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const signUpForm = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '', confirmPassword: '', fullName: '', phone: '' },
  });

  const forgotPasswordForm = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const resetPasswordForm = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const handleSignIn = async (values: SignInValues) => {
    setIsLoading(true);
    const { error } = await signIn(values.email, values.password);
    setIsLoading(false);

    if (error) {
      toast({
        title: 'Sign in failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      // Send new device login email
      try {
        const deviceInfo = `${navigator.userAgent.split('(')[1]?.split(')')[0] || 'Unknown device'}`;
        await supabase.functions.invoke('send-user-email', {
          body: {
            type: 'new_device',
            email: values.email,
            device_info: deviceInfo,
          }
        });
      } catch (emailError) {
        console.error('Failed to send login email:', emailError);
      }
    }
  };

  const handleSignUp = async (values: SignUpValues) => {
    setIsLoading(true);
    const { error } = await signUp(values.email, values.password, values.fullName);
    setIsLoading(false);

    if (error) {
      let message = error.message;
      if (message.includes('already registered')) {
        message = 'This email is already registered. Please sign in instead.';
      }
      toast({
        title: 'Sign up failed',
        description: message,
        variant: 'destructive',
      });
    } else {
      // Send welcome email
      try {
        await supabase.functions.invoke('send-user-email', {
          body: {
            type: 'welcome',
            email: values.email,
            name: values.fullName,
          }
        });
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
      }
      
      toast({
        title: 'Account created',
        description: 'Welcome to TAMIC GROUP! You can now sign in.',
      });
    }
  };

  const handleForgotPassword = async (values: ForgotPasswordValues) => {
    setIsLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    setIsLoading(false);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Check your email',
        description: 'We sent you a password reset link. Please check your inbox.',
      });
      setView('signin');
    }
  };

  const handleResetPassword = async (values: ResetPasswordValues) => {
    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({
      password: values.password,
    });
    setIsLoading(false);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Password updated',
        description: 'Your password has been reset successfully. You can now sign in.',
      });
      // Clear hash and redirect to sign in
      window.location.hash = '';
      setView('signin');
    }
  };

  // Forgot Password View
  if (view === 'forgot-password') {
    return (
      <div className="min-h-screen flex flex-col items-center bg-muted/30 p-4">
        <div className="w-full max-w-md mt-8 mb-6">
          <Button variant="ghost" className="mb-4 pl-0 hover:bg-transparent" onClick={() => setView('signin')}>
            <ArrowLeft className="h-5 w-5 mr-2 text-primary" />
            <span className="text-primary">Back to Login</span>
          </Button>
        </div>

        <div className="w-full max-w-md">
          <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="text-center px-0">
              <CardTitle className="text-2xl font-bold text-foreground">Forgot Password</CardTitle>
              <CardDescription>
                Enter your email address and we'll send you a link to reset your password.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <Form {...forgotPasswordForm}>
                <form onSubmit={forgotPasswordForm.handleSubmit(handleForgotPassword)} className="space-y-6">
                  <FormField
                    control={forgotPasswordForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">Email Address</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="Enter your email" 
                            className="bg-card border-border h-12 rounded-lg" 
                            autoComplete="email"
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full h-12 rounded-xl text-md font-medium" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send Reset Link
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Reset Password View (after clicking email link)
  if (view === 'reset-password') {
    return (
      <div className="min-h-screen flex flex-col items-center bg-muted/30 p-4">
        <div className="w-full max-w-md mt-8 mb-6" />

        <div className="w-full max-w-md">
          <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="text-center px-0">
              <CardTitle className="text-2xl font-bold text-foreground">Reset Password</CardTitle>
              <CardDescription>
                Enter your new password below.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <Form {...resetPasswordForm}>
                <form onSubmit={resetPasswordForm.handleSubmit(handleResetPassword)} className="space-y-6">
                  <FormField
                    control={resetPasswordForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">New Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showPassword ? "text" : "password"} 
                              placeholder="Enter new password" 
                              className="bg-card border-border h-12 rounded-lg pr-10" 
                              {...field} 
                            />
                            <button 
                              type="button" 
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                            >
                              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={resetPasswordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">Confirm New Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Confirm new password" className="bg-card border-border h-12 rounded-lg" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full h-12 rounded-xl text-md font-medium" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update Password
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-muted/30 p-4">
      <div className="w-full max-w-md mt-8 mb-6">
        {isSignUp && step === 'form' && (
          <Button variant="ghost" className="mb-4 pl-0 hover:bg-transparent" onClick={() => setStep('type-selection')}>
            <ChevronLeft className="h-6 w-6 text-primary" />
          </Button>
        )}
      </div>

      <div className="w-full max-w-md">
        {isSignUp && step === 'type-selection' ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-8">
              <p className="text-sm font-semibold text-primary mb-6 tracking-wide">Step 1 <span className="text-muted-foreground font-normal">Account Type</span></p>
              <h1 className="text-3xl font-bold text-primary mb-2">How will you use<br/>TAMIC GROUP?</h1>
              <p className="text-muted-foreground text-sm">Tap to select one</p>
            </div>

            <div className="space-y-4">
              <div 
                onClick={() => setAccountType('individual')}
                className={cn(
                  "cursor-pointer p-6 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 bg-card",
                  accountType === 'individual' ? "border-primary shadow-md" : "border-transparent shadow-sm hover:border-muted"
                )}
              >
                <div className={cn("h-12 w-12 rounded-full flex items-center justify-center", accountType === 'individual' ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary")}>
                  <User className="h-6 w-6" />
                </div>
                <span className="font-semibold text-lg text-foreground">Individual account</span>
              </div>

              <div 
                onClick={() => setAccountType('corporate')}
                className={cn(
                  "cursor-pointer p-6 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 bg-card",
                  accountType === 'corporate' ? "border-primary shadow-md" : "border-transparent shadow-sm hover:border-muted"
                )}
              >
                <div className={cn("h-12 w-12 rounded-full flex items-center justify-center", accountType === 'corporate' ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary")}>
                  <Building2 className="h-6 w-6" />
                </div>
                <span className="font-semibold text-lg text-foreground">Corporate account</span>
              </div>
            </div>

            <div className="mt-8 text-center text-xs text-muted-foreground px-8">
              By clicking "Proceed" button, you agree to TAMIC GROUP's <a href="#" className="text-primary font-semibold">Terms and Conditions</a>.
            </div>

            <Button 
              className="w-full mt-6 h-12 rounded-xl text-md font-medium"
              onClick={() => setStep('form')}
            >
              Proceed
            </Button>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Have an account?{' '}
                <button onClick={() => { setIsSignUp(false); setView('signin'); }} className="text-primary font-bold hover:underline">
                  Login
                </button>
              </p>
            </div>
          </div>
        ) : (
          <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="text-center px-0">
              <CardTitle className="text-2xl font-bold text-foreground">
                {isSignUp ? 'Tell us a bit about yourself' : 'Welcome Back'}
              </CardTitle>
              <CardDescription>
                {isSignUp
                  ? 'Step 2: Personal Information'
                  : 'Sign in to continue to TAMIC GROUP'}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              {isSignUp ? (
                <Form {...signUpForm}>
                  <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
                    <FormField
                      control={signUpForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground">Full Name <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="Enter full name" className="bg-card border-border h-12 rounded-lg" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={signUpForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground">Email Address <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Enter email address" className="bg-card border-border h-12 rounded-lg" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={signUpForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground">Password <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type={showPassword ? "text" : "password"} 
                                placeholder="••••••••" 
                                className="bg-card border-border h-12 rounded-lg pr-10" 
                                {...field} 
                              />
                              <button 
                                type="button" 
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                              >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={signUpForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground">Confirm Password <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" className="bg-card border-border h-12 rounded-lg" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full mt-6 h-12 rounded-xl text-md font-medium" disabled={isLoading}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Account
                    </Button>
                  </form>
                </Form>
              ) : (
                <Form {...signInForm}>
                  <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-6">
                    <FormField
                      control={signInForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground">Email Address</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Enter your email" className="bg-card border-border h-12 rounded-lg" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signInForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel className="text-foreground">Password</FormLabel>
                            <button
                              type="button"
                              onClick={() => setView('forgot-password')}
                              className="text-sm text-primary hover:underline"
                            >
                              Forgot Password?
                            </button>
                          </div>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type={showPassword ? "text" : "password"} 
                                placeholder="Enter your password" 
                                className="bg-card border-border h-12 rounded-lg pr-10" 
                                {...field} 
                              />
                              <button 
                                type="button" 
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                              >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full mt-6 h-12 rounded-xl text-md font-medium" disabled={isLoading}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Login
                    </Button>
                  </form>
                </Form>
              )}

              <div className="mt-8 text-center">
                <p className="text-sm text-muted-foreground">
                  {isSignUp
                    ? 'Already have an account? '
                    : "Don't have an account? "}
                  <button
                    type="button"
                    className="text-primary font-bold hover:underline"
                    onClick={() => { setIsSignUp(!isSignUp); setView(isSignUp ? 'signin' : 'signup'); }}
                  >
                    {isSignUp ? 'Login' : 'Sign Up'}
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}