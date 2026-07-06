export default function Loading() {
  return (
    <main className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-8 sm:px-6 lg:px-8">
      <div className="h-32 animate-pulse rounded-lg border border-white/10 bg-white/7" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-40 animate-pulse rounded-lg border border-white/10 bg-white/7" />
        <div className="h-40 animate-pulse rounded-lg border border-white/10 bg-white/7" />
        <div className="h-40 animate-pulse rounded-lg border border-white/10 bg-white/7" />
      </div>
    </main>
  );
}
