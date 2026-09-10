import { EmptyState, FullPageLoader, StatCard, StatusBadge } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { formatDate, formatNaira } from "@/lib/format";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Clock,
  ShoppingBasket,
  Store,
} from "lucide-react";
import { Link } from "react-router";
import { useQuery } from "convex/react";

export default function BuyerDashboard() {
  const { user } = useAuth();
  const stats = useQuery(api.orders.getBuyerStats, {});
  const orders = useQuery(api.orders.getMyOrders, {});

  if (stats === undefined || orders === undefined) {
    return <FullPageLoader label="Loading your dashboard…" />;
  }

  const recentOrders = orders.slice(0, 5);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Buyer dashboard</p>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Welcome{user?.name ? `, ${user.name}` : ""} 👋
          </h1>
        </div>
        <Button size="lg" asChild>
          <Link to="/marketplace">
            <Store className="size-4" aria-hidden="true" />
            Browse Marketplace
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <section
        className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4"
        aria-label="Your shopping statistics"
      >
        <StatCard label="Total orders" value={stats.totalOrders} icon={ShoppingBasket} />
        <StatCard
          label="Pending"
          value={stats.pendingOrders}
          icon={Clock}
          tone="warning"
          hint="Awaiting farmer confirmation"
        />
        <StatCard
          label="Completed"
          value={stats.completedOrders}
          icon={BadgeCheck}
          tone="positive"
        />
        <StatCard
          label="Total spent"
          value={formatNaira(stats.totalSpent)}
          icon={Banknote}
          tone="harvest"
          hint="On completed orders"
        />
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        {/* Recent orders */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-lg">Recent orders</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/buyer/orders">
                View all
                <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="px-0">
            {recentOrders.length === 0 ? (
              <EmptyState
                icon={ShoppingBasket}
                title="You haven't placed any orders yet."
                description="Explore the marketplace and order fresh produce directly from farmers."
                action={
                  <Button asChild>
                    <Link to="/marketplace">Browse marketplace</Link>
                  </Button>
                }
                className="border-0"
              />
            ) : (
              <ul className="divide-y">
                {recentOrders.map((order) => (
                  <li key={order.id}>
                    <Link
                      to={`/buyer/orders/${order.id}`}
                      className="flex items-center gap-3 p-4 transition-colors hover:bg-accent/50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {order.items[0]?.productName ?? "Order"}
                          {order.items.length > 1 &&
                            ` +${order.items.length - 1} more`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {order.farmer?.name ?? "Farmer"} ·{" "}
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">
                          {formatNaira(order.totalAmount)}
                        </p>
                        <StatusBadge status={order.status} />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Side panel */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Your profile</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <dl className="space-y-2">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Name</dt>
                  <dd className="truncate font-medium">{user?.name ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="truncate font-medium">{user?.email ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Phone</dt>
                  <dd className="truncate font-medium">{user?.phone ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Location</dt>
                  <dd className="truncate font-medium">
                    {user?.location ?? "—"}
                  </dd>
                </div>
              </dl>
              <Button variant="outline" size="sm" className="mt-4 w-full" asChild>
                <Link to="/buyer/profile">Edit profile</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <p className="font-display font-semibold">Ordering tips</p>
              <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                <li>• Orders are grouped per farmer automatically.</li>
                <li>• Farmers confirm before processing your order.</li>
                <li>• You can cancel while an order is still pending.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
