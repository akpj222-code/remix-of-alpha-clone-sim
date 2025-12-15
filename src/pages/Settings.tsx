import { Sun, Moon, Monitor } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/AppLayout';
import { useTheme } from '@/hooks/useTheme';
import { useProfile } from '@/hooks/useProfile';
import { cn } from '@/lib/utils';

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { profile } = useProfile();

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account preferences
          </p>
        </div>

        {/* Theme Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Choose how TAMIC GROUP looks to you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => setTheme('light')}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                  theme === 'light' 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className="h-12 w-12 rounded-full bg-background border flex items-center justify-center">
                  <Sun className="h-6 w-6 text-warning" />
                </div>
                <span className="text-sm font-medium text-foreground">Light</span>
              </button>

              <button
                onClick={() => setTheme('dark')}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                  theme === 'dark' 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className="h-12 w-12 rounded-full bg-card border flex items-center justify-center">
                  <Moon className="h-6 w-6 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">Dark</span>
              </button>

              <button
                onClick={() => {
                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  setTheme(prefersDark ? 'dark' : 'light');
                }}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all border-border hover:border-primary/50"
                )}
              >
                <div className="h-12 w-12 rounded-full bg-muted border flex items-center justify-center">
                  <Monitor className="h-6 w-6 text-muted-foreground" />
                </div>
                <span className="text-sm font-medium text-foreground">System</span>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Your account details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="text-sm font-medium text-foreground">{profile?.email}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Full Name</span>
              <span className="text-sm font-medium text-foreground">{profile?.full_name || 'Not set'}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground">Balance</span>
              <span className="text-sm font-medium text-foreground">${profile?.balance?.toFixed(2) || '0.00'}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
