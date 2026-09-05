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
  Users,
  History,
  Tag,
  ShieldCheck,
  Link2,
  Award
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
      { name: "Fulfillment", href: "/operations", icon: Package, roles: ["sales", "finance", "admin"] },
      { name: "Subscriptions", href: "/subscriptions", icon: RefreshCcw, roles: ["sales", "finance", "admin"] },
      { name: "Invoices", href: "/invoices", icon: Receipt, roles: ["sales", "finance", "admin"] },
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
      { name: "Users", href: "/users", icon: Users },
      { name: "Products", href: "/products", icon: Box },
      { name: "Categories", href: "/categories", icon: Tag },
      { name: "Customer Tiers", href: "/customer-tiers", icon: Award },
      { name: "Pricing Rules", href: "/pricing-rules", icon: Settings2 },
      { name: "Discount Policies", href: "/discount-policies", icon: Settings2 },
      { name: "Approval Rules", href: "/approval-rules", icon: ShieldCheck },
      { name: "Approval Chains", href: "/approval-chains", icon: Link2 },
      { name: "Warehouses", href: "/warehouses", icon: Warehouse },
      { name: "Subscription Plans", href: "/subscription-plans", icon: CreditCard },
      { name: "Audit Logs", href: "/audit-logs", icon: History },
      { name: "Settings", href: "/settings", icon: Settings },
    ],
  },
];
