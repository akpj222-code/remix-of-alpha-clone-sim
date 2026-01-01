import { FlaskConical, X, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDemo } from '@/hooks/useDemo';

export function DemoBanner() {
  const { isDemoMode, demoBalance, exitDemo } = useDemo();

  if (!isDemoMode) return null;

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
        <Button
          variant="ghost"
          size="sm"
          onClick={exitDemo}
          className="text-white hover:bg-white/20 gap-1"
        >
          <X className="h-4 w-4" />
          <span className="hidden sm:inline">Exit Demo</span>
        </Button>
      </div>
    </div>
  );
}
