export function BackgroundFX() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,black_20%,transparent_75%)]" />
      <div className="animate-drift absolute -top-40 left-1/4 h-[32rem] w-[32rem] rounded-full bg-accent-violet/25 blur-[120px]" />
      <div className="animate-drift-slow absolute top-1/3 -right-40 h-[28rem] w-[28rem] rounded-full bg-accent-cyan/20 blur-[120px]" />
      <div className="animate-drift absolute bottom-0 left-1/3 h-[24rem] w-[24rem] rounded-full bg-accent-pink/15 blur-[120px]" />
    </div>
  );
}
