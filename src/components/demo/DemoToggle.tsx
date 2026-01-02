import { FlaskConical, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDemo } from '@/hooks/useDemo';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { StartDemoModal } from './StartDemoModal';
import { cn } from '@/lib/utils';

export function DemoToggle() {
  const { isDemoMode, exitDemo, demoBalance } = useDemo();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showDemoModal, setShowDemoModal] = useState(false);

  const handleSwitchToLive = () => {
    exitDemo();
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  const handleStartDemo = () => {
    setShowDemoModal(true);
  };

  return (
    <>
      <div className="flex items-center gap-1 bg-muted/50 rounded-full p-1">
        {/* Live Mode Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={isDemoMode ? handleSwitchToLive : undefined}
          className={cn(
            "rounded-full gap-1.5 h-8 px-3 transition-all",
            !isDemoMode 
              ? "bg-primary text-primary-foreground hover:bg-primary/90" 
              : "hover:bg-muted text-muted-foreground"
          )}
        >
          <Zap className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">Live</span>
        </Button>

        {/* Demo Mode Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={isDemoMode ? undefined : handleStartDemo}
          className={cn(
            "rounded-full gap-1.5 h-8 px-3 transition-all",
            isDemoMode 
              ? "bg-amber-500 text-white hover:bg-amber-500/90" 
              : "hover:bg-muted text-muted-foreground"
          )}
        >
          <FlaskConical className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">Demo</span>
          {isDemoMode && (
            <span className="text-xs opacity-80 hidden sm:inline">
              ${demoBalance.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          )}
        </Button>
      </div>

      <StartDemoModal open={showDemoModal} onOpenChange={setShowDemoModal} showTrigger={false} />
    </>
  );
}
