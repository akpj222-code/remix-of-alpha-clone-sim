export function KilledScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="text-8xl animate-pulse">💀</div>
        <h1 className="text-4xl font-bold text-foreground">
          Oops...
        </h1>
        <p className="text-xl text-muted-foreground">
          Your website has been <span className="text-destructive font-semibold">Killed</span> x_x
        </p>
        <div className="pt-8 text-xs text-muted-foreground/50">
          If you believe this is an error, contact the developer.
        </div>
      </div>
    </div>
  );
}