import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, TrendingUp, Briefcase, FileText, LogOut, Shield, Bitcoin, Settings, Sun, Moon, Wallet, ArrowDownToLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { TamicLogo } from '@/components/TamicLogo';
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
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Branding letters configuration
  const brandingLetters = [
    { char: 'I', from: 'from-cyan-400', to: 'to-pink-500' },     // Light Blue & Pinkish Red
    { char: 'C', from: 'from-red-500', to: 'to-yellow-400' },    // Red & Yellow
    { char: 'A', from: 'from-green-400', to: 'to-blue-500' },    // Green & Blue
    { char: 'R', from: 'from-purple-500', to: 'to-pink-400' },   // Purple & Pink
    { char: 'U', from: 'from-orange-400', to: 'to-red-500' },    // Orange & Red
    { char: 'S', from: 'from-indigo-400', to: 'to-cyan-400' },   // Indigo & Cyan
    { char: 'T', from: 'from-pink-500', to: 'to-rose-600' },     // Pink & Rose
    { char: 'U', from: 'from-yellow-400', to: 'to-orange-500' }, // Yellow & Orange
    { char: 'D', from: 'from-blue-400', to: 'to-violet-500' },   // Blue & Violet
    { char: 'I', from: 'from-teal-400', to: 'to-emerald-500' },  // Teal & Emerald
    { char: 'O', from: 'from-fuchsia-500', to: 'to-purple-600' },// Fuchsia & Purple
  ];

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

      {/* Main Content - Flex-1 pushes footer down */}
      <main className="container py-6 flex-1">{children}</main>

      {/* Footer with ICARUSTUDIO Branding */}
      <footer className="w-full py-6 pb-24 lg:pb-6 text-center border-t bg-card/30">
        <div className="flex items-center justify-center gap-2">
          <span className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Powered by</span>
          <div className="flex select-none">
            {brandingLetters.map((l, i) => (
              <span
                key={i}
                className={cn(
                  "text-lg font-black bg-gradient-to-br bg-clip-text text-transparent hover:scale-110 transition-transform cursor-default",
                  l.from,
                  l.to
                )}
              >
                {l.char}
              </span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
