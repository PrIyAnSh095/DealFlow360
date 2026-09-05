export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">What needs your attention today.</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Placeholder cards */}
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card text-card-foreground shadow-sm p-6 bg-background">
            <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Metric {i}</h3>
            <div className="text-2xl font-bold mt-2">$45,231.89</div>
          </div>
        ))}
      </div>
    </div>
  );
}
