import {
  LayoutDashboard,
  Briefcase,
  FileText,
  CheckSquare,
  Package,
  RefreshCcw,
  Receipt,
  HeartPulse,
  BarChart,
  Box,
  Settings2,
  Warehouse,
  CreditCard,
  Settings,
} from "lucide-react";

export const navigation = [
  {
    name: "Overview",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    name: "Sales",
    items: [
      { name: "Deals", href: "/deals", icon: Briefcase },
      { name: "Quotations", href: "/quotations", icon: FileText },
      { name: "Approvals", href: "/approvals", icon: CheckSquare },
    ],
  },
  {
    name: "Operations",
    items: [
      { name: "Fulfillment", href: "/fulfillment", icon: Package },
      { name: "Subscriptions", href: "/subscriptions", icon: RefreshCcw },
      { name: "Invoices", href: "/invoices", icon: Receipt },
    ],
  },
  {
    name: "Intelligence",
    items: [
      { name: "Deal Health", href: "/health", icon: HeartPulse },
      { name: "Analytics", href: "/analytics", icon: BarChart },
    ],
  },
  {
    name: "Administration",
    items: [
      { name: "Products", href: "/products", icon: Box },
      { name: "Pricing Rules", href: "/pricing-rules", icon: Settings2 },
      { name: "Warehouses", href: "/warehouses", icon: Warehouse },
      { name: "Subscription Plans", href: "/subscription-plans", icon: CreditCard },
      { name: "Settings", href: "/settings", icon: Settings },
    ],
  },
];
