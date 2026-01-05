import { FlaskConical } from 'lucide-react';
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
      <div className="flex items-center border border-border rounded-md overflow-hidden">
        {/* Live Mode Button */}
        <button
          onClick={isDemoMode ? handleSwitchToLive : undefined}
          className={cn(
            "px-3 py-1.5 text-xs font-medium transition-colors",
            !isDemoMode 
              ? "bg-primary text-primary-foreground" 
              : "bg-transparent text-muted-foreground hover:bg-muted"
          )}
        >
          Live
        </button>

        {/* Demo Mode Button */}
        <button
          onClick={isDemoMode ? undefined : handleStartDemo}
          className={cn(
            "px-3 py-1.5 text-xs font-medium transition-colors border-l border-border",
            isDemoMode 
              ? "bg-amber-500 text-white" 
              : "bg-transparent text-muted-foreground hover:bg-muted"
          )}
        >
          Demo
        </button>
      </div>

      <StartDemoModal open={showDemoModal} onOpenChange={setShowDemoModal} showTrigger={false} />
    </>
  );
}
