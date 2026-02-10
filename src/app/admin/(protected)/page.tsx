import SimpleDashboard from "@/components/admin/simple-dashboard";
import { fetchOrdersAdmin, fetchPackagesAdmin } from "@/lib/db";
import { OrderRecord, PackageRecord } from "@/lib/types";

export default async function AdminHome() {
  let packages: PackageRecord[] = [];
  let orders: OrderRecord[] = [];
  
  try {
    [packages, orders] = await Promise.all([
      fetchPackagesAdmin(),
      fetchOrdersAdmin(),
    ]);
  } catch {
    packages = [];
    orders = [];
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-10 sm:px-10">
      <SimpleDashboard initialPackages={packages} initialOrders={orders} />
    </main>
  );
}
