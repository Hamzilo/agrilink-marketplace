import { EmptyState, StatCard, StatusBadge, FullPageLoader } from "@/components/shared/EmptyState";
import { ProductImageFallback } from "@/components/marketplace/ProductCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { formatDate, formatNaira, formatPriceUnit } from "@/lib/format";
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Banknote,
  Package,
  PackagePlus,
  Plus,
  ShoppingBag,
  Sprout,
  Clock,
  ClipboardList,
} from "lucide-react";
import { Link } from "react-router";
import { useQuery } from "convex/react";

export default function FarmerDashboard() {
  const { user } = useAuth();
  const stats = useQuery(api.orders.getFarmerStats, {});
  const products = useQuery(api.products.getMyProducts, {});
  const orders = useQuery(api.orders.getFarmerOrders, {});

  if (stats === undefined || products === undefined || orders === undefined) {
    return <FullPageLoader label="Loading your dashboard…" />;
  }

  const recentProducts = products.slice(0, 4);
  const recentOrders = orders.slice(0, 5);
  const actionOrders = orders.filter(
    (o) => o.status === "pending" || o.status === "confirmed",
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Welcome */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Farmer dashboard</p>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Welcome{user?.name ? `, ${user.name}` : ""} 👋
          </h1>
        </div>
        <Button size="lg" asChild>
          <Link to="/farmer/products/new">
            <Plus className="size-4" aria-hidden="true" />
            Add Product
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Farm statistics">
        <StatCard
          label="Total products"
          value={stats.totalProducts}
          icon={Package}
          hint={`${stats.availableProducts} available · ${stats.outOfStock} out of stock`}
        />
        <StatCard
          label="Pending orders"
          value={stats.pendingOrders}
          icon={Clock}
          tone="warning"
          hint="Awaiting your confirmation"
        />
        <StatCard
          label="Completed orders"
          value={stats.completedOrders}
          icon={BadgeCheck}
          tone="positive"
        />
        <StatCard
          label="Revenue"
          value={formatNaira(stats.revenue)}
          icon={Banknote}
          tone="harvest"
          hint="From completed orders"
        />
      </section>

      {/* Action needed */}
      {actionOrders.length > 0 && (
        <Card className="mt-6 border-harvest/40 bg-harvest/5">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-harvest/20 text-harvest-foreground">
                <AlertCircle className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="font-semibold">
                  {actionOrders.length} order{actionOrders.length > 1 ? "s" : ""} need
                  your attention
                </p>
                <p className="text-sm text-muted-foreground">
                  Confirm new orders to keep buyers updated.
                </p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link to="/farmer/orders">
                Review orders
                <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick actions */}
      <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Quick actions">
        {[
          { to: "/farmer/products/new", label: "Add Product", icon: PackagePlus },
          { to: "/farmer/products", label: "Manage Products", icon: Package },
          { to: "/farmer/orders", label: "View Orders", icon: ClipboardList },
          { to: "/farmer/profile", label: "Edit Profile", icon: Sprout },
        ].map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
          >
            <span className="flex size-10 items-center justify-center rounded-lg bg-secondary text-primary">
              <action.icon className="size-5" aria-hidden="true" />
            </span>
            <span className="font-medium">{action.label}</span>
          </Link>
        ))}
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        {/* Recent orders */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-lg">Recent orders</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/farmer/orders">
                View all
                <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="px-0">
            {recentOrders.length === 0 ? (
              <EmptyState
                icon={ShoppingBag}
                title="No orders yet"
                description="When buyers order your products, they'll appear here."
                className="border-0"
              />
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Buyer</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">
                            {order.buyer?.name ?? "Buyer"}
                          </TableCell>
                          <TableCell>
                            {order.items[0]?.productName ?? "—"}
                            {order.items.length > 1 && (
                              <span className="text-muted-foreground">
                                {" "}
                                +{order.items.length - 1} more
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatNaira(order.totalAmount)}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={order.status} />
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(order.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {/* Mobile cards */}
                <div className="divide-y md:hidden">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center gap-3 p-4">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {order.buyer?.name ?? "Buyer"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {order.items[0]?.productName}
                          {order.items.length > 1 &&
                            ` +${order.items.length - 1} more`}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">
                          {formatNaira(order.totalAmount)}
                        </p>
                        <StatusBadge status={order.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Recent products */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-lg">Your products</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/farmer/products">Manage</Link>
            </Button>
          </CardHeader>
          <CardContent className="px-3">
            {recentProducts.length === 0 ? (
              <EmptyState
                icon={Sprout}
                title="No products yet"
                description="Add your first product to start selling on AgriLink."
                action={
                  <Button asChild>
                    <Link to="/farmer/products/new">
                      <Plus className="size-4" /> Add your first product
                    </Link>
                  </Button>
                }
                className="border-0"
              />
            ) : (
              <ul className="space-y-1">
                {recentProducts.map((product) => (
                  <li key={product.id}>
                    <Link
                      to={`/farmer/products/${product.id}/edit`}
                      className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-accent"
                    >
                      <span className="size-12 shrink-0 overflow-hidden rounded-lg bg-secondary">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt=""
                            aria-hidden="true"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ProductImageFallback />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {product.name}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {product.quantity} {product.unit} · {product.categoryName}
                        </span>
                      </span>
                      <span className="text-right">
                        <span className="block text-sm font-bold">
                          {formatPriceUnit(product.price, product.unit)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
