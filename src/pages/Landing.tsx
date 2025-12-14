import { Link } from 'react-router-dom';
import { TrendingUp, Shield, Briefcase, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const features = [
  {
    icon: TrendingUp,
    title: 'Real-Time Trading',
    description: 'Trade US stocks with live market data and instant execution'
  },
  {
    icon: Briefcase,
    title: 'Portfolio Management',
    description: 'Track your investments and monitor your gains in real-time'
  },
  {
    icon: Shield,
    title: 'Secure Platform',
    description: 'Bank-level security with complete KYC verification'
  }
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
              <span className="text-lg font-bold text-primary-foreground">CS</span>
            </div>
            <span className="text-xl font-bold text-foreground">Alpha</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/auth">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/auth?mode=signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 gradient-hero opacity-5" />
        <div className="container relative">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Invest in Your Future with{' '}
              <span className="text-primary">CS Alpha</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground md:text-xl">
              Your trusted platform for US stock trading. Start building your investment portfolio today with real-time market data and seamless trading experience.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth?mode=signup">
                <Button size="lg" className="gap-2">
                  Start Trading <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            Why Choose CS Alpha?
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="border-none shadow-md">
                <CardContent className="pt-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg gradient-primary">
                    <feature.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container">
          <Card className="gradient-primary border-none">
            <CardContent className="py-12 text-center">
              <h2 className="text-3xl font-bold text-primary-foreground mb-4">
                Ready to Start Investing?
              </h2>
              <p className="text-primary-foreground/80 mb-8 max-w-lg mx-auto">
                Join thousands of investors who trust CS Alpha for their trading needs. Get started with $10,000 in virtual funds.
              </p>
              <Link to="/auth?mode=signup">
                <Button size="lg" variant="secondary">
                  Create Free Account
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded gradient-primary">
                <span className="text-sm font-bold text-primary-foreground">CS</span>
              </div>
              <span className="font-semibold text-foreground">Alpha</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 CS Alpha. Investment simulation platform.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}