import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Wallet, TrendingUp, Shield, ArrowDownToLine, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TutorialStep {
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface TutorialModalProps {
  isAdmin?: boolean;
  onComplete: () => void;
}

const userSteps: TutorialStep[] = [
  {
    title: 'Welcome to TamicGroups',
    description: 'Your professional investment platform for securities and digital assets. Let us show you around!',
    icon: <TrendingUp className="h-12 w-12 text-primary" />,
  },
  {
    title: 'Your Wallet',
    description: 'View your balance, manage crypto wallets, and track your deposits. Access it from the Wallet tab.',
    icon: <Wallet className="h-12 w-12 text-primary" />,
  },
  {
    title: 'Securities Trading',
    description: 'Trade stocks from major exchanges. Browse available stocks and execute trades directly from the app.',
    icon: <Shield className="h-12 w-12 text-primary" />,
  },
  {
    title: 'TAMG Shares',
    description: 'Subscribe to TAMIC GROUP shares (TAMG) directly from your dashboard. Watch your investment grow!',
    icon: <TrendingUp className="h-12 w-12 text-primary" />,
  },
  {
    title: 'Deposits & Withdrawals',
    description: 'Deposit via bank transfer or crypto. Withdraw to your bank account or external crypto wallet.',
    icon: <ArrowDownToLine className="h-12 w-12 text-primary" />,
  },
  {
    title: 'Complete Your KYC',
    description: 'To unlock full trading capabilities, complete your KYC verification in Settings.',
    icon: <Settings className="h-12 w-12 text-primary" />,
  },
];

const adminSteps: TutorialStep[] = [
  {
    title: 'Admin Dashboard',
    description: 'Welcome to the admin panel. Manage users, review KYC applications, and configure platform settings.',
    icon: <Shield className="h-12 w-12 text-primary" />,
  },
  {
    title: 'KYC Management',
    description: 'Review and approve/reject KYC applications. View submitted documents and user information.',
    icon: <Shield className="h-12 w-12 text-primary" />,
  },
  {
    title: 'User Management',
    description: 'Search users, view their balances, and add or remove funds from their accounts.',
    icon: <Wallet className="h-12 w-12 text-primary" />,
  },
  {
    title: 'Withdrawal Requests',
    description: 'Review pending withdrawals and mark them as completed or declined after processing.',
    icon: <ArrowDownToLine className="h-12 w-12 text-primary" />,
  },
  {
    title: 'Platform Settings',
    description: 'Configure deposit addresses, TAMG share price, minimum share purchase, and notification email.',
    icon: <Settings className="h-12 w-12 text-primary" />,
  },
];

export function TutorialModal({ isAdmin = false, onComplete }: TutorialModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  
  const steps = isAdmin ? adminSteps : userSteps;
  const totalSteps = steps.length;
  
  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };
  
  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleComplete = () => {
    setIsVisible(false);
    onComplete();
  };
  
  const handleSkip = () => {
    handleComplete();
  };
  
  if (!isVisible) return null;
  
  const step = steps[currentStep];
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-card border rounded-xl shadow-2xl overflow-hidden">
        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-muted transition-colors z-10"
        >
          <X className="h-5 w-5 text-muted-foreground" />
        </button>
        
        {/* Content */}
        <div className="p-8 text-center">
          <div className="mb-6 flex justify-center">
            <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
              {step.icon}
            </div>
          </div>
          
          <h2 className="text-xl font-bold text-foreground mb-3">{step.title}</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
        </div>
        
        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 pb-6">
          {steps.map((_, index) => (
            <div
              key={index}
              className={cn(
                "h-2 rounded-full transition-all",
                index === currentStep ? "w-6 bg-primary" : "w-2 bg-muted"
              )}
            />
          ))}
        </div>
        
        {/* Navigation */}
        <div className="flex items-center justify-between p-4 border-t bg-muted/30">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
          
          <span className="text-xs text-muted-foreground">
            {currentStep + 1} of {totalSteps}
          </span>
          
          <Button
            size="sm"
            onClick={handleNext}
            className="gap-1"
          >
            {currentStep === totalSteps - 1 ? 'Get Started' : 'Next'}
            {currentStep < totalSteps - 1 && <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default TutorialModal;