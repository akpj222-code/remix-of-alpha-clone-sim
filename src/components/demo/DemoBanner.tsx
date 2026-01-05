import { FlaskConical, X } from 'lucide-react';
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
    <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 py-1.5 px-3 shadow-sm">
      <div className="container flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-3.5 w-3.5 text-white" />
          <span className="text-xs font-semibold text-white uppercase tracking-wide">Demo</span>
          <span className="text-xs text-white/90 hidden sm:inline">•</span>
          <span className="text-xs text-white/90 hidden sm:inline">
            ${demoBalance.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSwitchToLive}
            className="text-white hover:bg-white/20 h-6 px-2 text-xs hidden sm:flex"
          >
            Go Live
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleExitDemo}
            className="text-white hover:bg-white/20 h-6 w-6"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
