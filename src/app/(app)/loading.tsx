export default function Loading() {
  return (
    <div className="animate-pulse space-y-3" aria-busy="true" aria-label="Caricamento">
      <div className="h-8 w-40 rounded-lg bg-surface-2" />
      <div className="h-10 rounded-xl bg-surface-2" />
      <div className="h-40 rounded-2xl bg-surface-2" />
      <div className="h-28 rounded-2xl bg-surface-2" />
      <div className="h-28 rounded-2xl bg-surface-2" />
    </div>
  );
}
