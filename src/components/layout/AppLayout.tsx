import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, TrendingUp, Briefcase, FileText, LogOut, Shield, Bitcoin, Settings, Sun, Moon, Wallet, ArrowDownToLine, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { useDemo } from '@/hooks/useDemo';
import { TamicLogo } from '@/components/TamicLogo';
import { StartDemoModal } from '@/components/demo/StartDemoModal';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: Home },
  { path: '/stocks', label: 'Stocks', icon: TrendingUp },
  { path: '/crypto', label: 'Crypto', icon: Bitcoin },
  { path: '/portfolio', label: 'Portfolio', icon: Briefcase },
  { path: '/wallet', label: 'Wallet', icon: Wallet },
  { path: '/deposit', label: 'Deposit', icon: ArrowDownToLine },
  { path: '/kyc', label: 'KYC', icon: FileText },
];

export function AppLayout({ children }: AppLayoutProps) {
  const { user, isAdmin, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isDemoMode } = useDemo();
  const location = useLocation();
  const navigate = useNavigate();
  const [showDemoModal, setShowDemoModal] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/dashboard">
            <TamicLogo size="md" />
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={location.pathname === item.path ? 'secondary' : 'ghost'}
                  size="sm"
                  className="gap-2"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            ))}
            {isAdmin && (
              <Link to="/admin">
                <Button variant={location.pathname.startsWith('/admin') ? 'secondary' : 'ghost'} size="sm" className="gap-2">
                  <Shield className="h-4 w-4" />
                  Admin
                </Button>
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2">
            {!isDemoMode && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowDemoModal(true)}
                className="hidden sm:flex gap-2"
              >
                <Play className="h-4 w-4" />
                Demo Mode
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Link to="/settings">
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
            <span className="hidden sm:inline text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
          
          <StartDemoModal open={showDemoModal} onOpenChange={setShowDemoModal} showTrigger={false} />
        </div>
      </header>

      {/* Mobile Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur lg:hidden">
        <div className="flex items-center justify-around py-2">
          {navItems.slice(0, 5).map((item) => (
            <Link key={item.path} to={item.path}>
              <Button
                variant="ghost"
                size="sm"
                className={cn("flex-col gap-1 h-auto py-2", location.pathname === item.path && "text-primary")}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-xs">{item.label}</span>
              </Button>
            </Link>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="container py-6 flex-1">{children}</main>

      {/* Footer - Minimal & Subtle */}
      <footer className="w-full py-6 pb-24 lg:pb-6 text-center border-t bg-card/30">
        <div className="flex items-center justify-center gap-2 opacity-70 hover:opacity-100 transition-opacity">
          <span className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium">Powered by</span>
          <span className="text-xs font-medium text-muted-foreground tracking-[0.2em] hover:text-primary transition-colors cursor-default">
            ICARUSTUDIO
          </span>
        </div>
      </footer>
    </div>
  );
}
