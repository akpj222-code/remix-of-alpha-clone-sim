import { cn } from '@/lib/utils';

interface TamicLogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function TamicLogo({ className, showText = true, size = 'md' }: TamicLogoProps) {
  const sizes = {
    sm: { icon: 'h-7 w-7', text: 'text-lg' },
    md: { icon: 'h-9 w-9', text: 'text-xl' },
    lg: { icon: 'h-12 w-12', text: 'text-2xl' },
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Professional Financial Logo */}
      <div className={cn(
        "relative flex items-center justify-center rounded-lg overflow-hidden",
        sizes[size].icon
      )}>
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-accent" />
        
        {/* Logo mark - stylized T with chart line */}
        <svg 
          viewBox="0 0 40 40" 
          className="relative z-10 w-full h-full p-1.5"
          fill="none"
        >
          {/* Outer frame */}
          <rect 
            x="2" y="2" 
            width="36" height="36" 
            rx="4" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            className="text-primary-foreground/30"
          />
          
          {/* T letter */}
          <path 
            d="M10 12H30M20 12V28" 
            stroke="currentColor" 
            strokeWidth="3" 
            strokeLinecap="round"
            className="text-primary-foreground"
          />
          
          {/* Chart line accent */}
          <path 
            d="M8 26L14 22L20 24L26 18L32 20" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary-foreground/70"
          />
          
          {/* Dot accent */}
          <circle 
            cx="32" cy="20" r="2" 
            fill="currentColor"
            className="text-primary-foreground"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <span className={cn("font-bold tracking-tight text-foreground", sizes[size].text)}>
            TAMIC
          </span>
          <span className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
            Group
          </span>
        </div>
      )}
    </div>
  );
}