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
import type { UserRole } from "@/features/auth/types";

const INTERNAL_ROLES: UserRole[] = ["sales_rep", "sales_manager", "finance", "admin"];
const APPROVAL_ROLES: UserRole[] = ["sales_rep", "sales_manager", "finance", "admin"];
const ANALYTICS_ROLES: UserRole[] = ["sales_manager", "finance", "admin"];
const AUDIT_ROLES: UserRole[] = ["sales_manager", "finance", "admin"];

export const navigation = [
  {
    name: "Overview",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: INTERNAL_ROLES },
    ],
  },
  {
    name: "Sales",
    items: [
      { name: "Deals", href: "/deals", icon: Briefcase, roles: INTERNAL_ROLES },
      { name: "Quotations", href: "/quotations", icon: FileText, roles: INTERNAL_ROLES },
      { name: "Approvals", href: "/approvals", icon: CheckSquare, roles: APPROVAL_ROLES },
    ],
  },
  {
    name: "Operations",
    items: [
      { name: "Fulfillment", href: "/operations", icon: Package, roles: ["finance", "admin"] },
      { name: "Subscriptions", href: "/subscriptions", icon: RefreshCcw, roles: ["finance", "admin"] },
      { name: "Invoices", href: "/invoices", icon: Receipt, roles: ["finance", "admin"] },
    ],
  },
  {
    name: "Intelligence",
    items: [
      { name: "Deal Health", href: "/health", icon: HeartPulse, roles: INTERNAL_ROLES },
      { name: "Analytics", href: "/analytics", icon: BarChart, roles: ANALYTICS_ROLES },
    ],
  },
  {
    name: "Administration",
    items: [
      { name: "Users", href: "/users", icon: Users, roles: ["admin"] },
      { name: "Products", href: "/products", icon: Box, roles: ["admin"] },
      { name: "Categories", href: "/categories", icon: Tag, roles: ["admin"] },
      { name: "Customer Tiers", href: "/customer-tiers", icon: Award, roles: ["admin"] },
      { name: "Discount Policies", href: "/discount-policies", icon: Settings2, roles: ["admin"] },
      { name: "Warehouses", href: "/warehouses", icon: Warehouse, roles: ["finance", "admin"] },
      { name: "Subscription Plans", href: "/subscription-plans", icon: CreditCard, roles: ["admin"] },
      { name: "Audit Logs", href: "/audit-logs", icon: History, roles: AUDIT_ROLES },
      { name: "Settings", href: "/settings", icon: Settings, roles: ["admin"] },
    ],
  },
];

export function canAccessRoute(pathname: string, role: UserRole): boolean {
  return navigation.some((section) =>
    section.items.some((item) => pathname.startsWith(item.href) && item.roles.includes(role))
  );
}
