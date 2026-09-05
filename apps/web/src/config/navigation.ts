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
    name: "Workspace",
    items: [
      { name: "Overview", href: "/dashboard", icon: LayoutDashboard, roles: ["sales", "manager", "finance", "admin"] },
      { name: "Deals", href: "/deals", icon: Briefcase, roles: ["sales", "manager", "admin"] },
      { name: "Quotations", href: "/quotations", icon: FileText, roles: ["sales", "manager", "admin"] },
      { name: "Approvals", href: "/approvals", icon: CheckSquare, roles: ["manager", "finance", "admin"] },
    ],
  },
  {
    name: "Operations",
    items: [
      { name: "Fulfillment", href: "/operations", icon: Package, roles: ["sales", "finance", "admin"] },
      { name: "Subscriptions", href: "/subscriptions", icon: RefreshCcw, roles: ["finance", "admin"] },
      { name: "Invoices", href: "/invoices", icon: Receipt, roles: ["finance", "admin"] },
    ],
  },
  {
    name: "Intelligence",
    items: [
      { name: "Deal Health", href: "/health", icon: HeartPulse, roles: ["sales", "manager", "admin"] },
      { name: "Analytics", href: "/analytics", icon: BarChart, roles: ["manager", "admin"] },
    ],
  },
  {
    name: "Administration",
    items: [
      { name: "Products", href: "/products", icon: Box, roles: ["admin"] },
      { name: "Pricing Rules", href: "/pricing-rules", icon: Settings2, roles: ["manager", "admin"] },
      { name: "Warehouses", href: "/warehouses", icon: Warehouse, roles: ["admin"] },
      { name: "Subscription Plans", href: "/subscription-plans", icon: CreditCard, roles: ["admin"] },
      { name: "Settings", href: "/settings", icon: Settings, roles: ["sales", "manager", "finance", "customer", "admin"] },
    ],
  },
];
