import { CustomerPortalLayout } from "@/features/customer/components/customer-portal-layout";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CustomerPortalLayout>{children}</CustomerPortalLayout>;
}
