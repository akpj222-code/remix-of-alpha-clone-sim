import { FlaskConical, X, GraduationCap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDemo } from '@/hooks/useDemo';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export function DemoBanner() {
  const { isDemoMode, demoBalance, exitDemo } = useDemo();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!isDemoMode) return null;

  const handleExitDemo = () => {
    exitDemo();
    // If user is not authenticated, redirect to landing
    if (!user) {
      navigate('/');
    }
  };

  const handleSwitchToLive = () => {
    exitDemo();
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white py-2 px-4 shadow-lg">
      <div className="container flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/20 rounded-full px-3 py-1">
            <FlaskConical className="h-4 w-4" />
            <span className="text-sm font-bold uppercase tracking-wide">Demo Mode</span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            <span className="text-sm">Practice Trading</span>
          </div>
          <div className="text-sm font-semibold">
            Balance: ${demoBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSwitchToLive}
            className="text-white hover:bg-white/20 gap-1 hidden sm:flex"
          >
            <ArrowRight className="h-4 w-4" />
            Switch to Live
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExitDemo}
            className="text-white hover:bg-white/20 gap-1"
          >
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">Exit Demo</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
