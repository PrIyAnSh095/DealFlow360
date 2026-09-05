#!/bin/bash
mkdir -p apps/web/src/app/\(internal\)/products
mkdir -p apps/web/src/app/\(internal\)/warehouses
mkdir -p apps/web/src/app/\(internal\)/subscription-plans
mkdir -p apps/web/src/app/\(internal\)/pricing-rules
mkdir -p apps/web/src/app/\(internal\)/settings

cat << 'INNER_EOF' > apps/web/src/app/\(internal\)/products/page.tsx
export default function ProductsPage() { return <div className="p-8"><h1>Products Admin</h1><p>Product catalog management</p></div>; }
INNER_EOF

cat << 'INNER_EOF' > apps/web/src/app/\(internal\)/warehouses/page.tsx
export default function WarehousesPage() { return <div className="p-8"><h1>Warehouses Admin</h1><p>Inventory map management</p></div>; }
INNER_EOF

cat << 'INNER_EOF' > apps/web/src/app/\(internal\)/subscription-plans/page.tsx
export default function SubscriptionPlansPage() { return <div className="p-8"><h1>Subscription Plans Admin</h1><p>Tiers management</p></div>; }
INNER_EOF

cat << 'INNER_EOF' > apps/web/src/app/\(internal\)/pricing-rules/page.tsx
export default function PricingRulesPage() { return <div className="p-8"><h1>Pricing Rules Admin</h1><p>Margins and discounts management</p></div>; }
INNER_EOF

cat << 'INNER_EOF' > apps/web/src/app/\(internal\)/settings/page.tsx
export default function SettingsPage() { return <div className="p-8"><h1>Global Settings</h1><p>System configuration</p></div>; }
INNER_EOF
