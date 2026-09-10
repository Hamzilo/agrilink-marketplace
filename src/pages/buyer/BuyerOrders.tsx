import { EmptyState, FullPageLoader, StatusBadge } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { formatDate, formatNaira } from "@/lib/format";
import { ShoppingBasket } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { useQuery } from "convex/react";

export default function BuyerOrders() {
  const orders = useQuery(api.orders.getMyOrders, {});
  const [statusFilter, setStatusFilter] = useState<string>("all");

  if (orders === undefined) {
    return <FullPageLoader label="Loading your orders…" />;
  }

  const filtered =
    statusFilter === "all"
      ? orders
      : orders.filter((o) => o.status === statusFilter);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-3xl font-bold tracking-tight">
        My Orders
      </h1>
      <p className="mt-1 text-muted-foreground">
        Track every order you've placed on AgriLink.
      </p>

      {/* Status filter pills */}
      <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto pb-1">
        {(["all", "pending", "confirmed", "processing", "completed", "cancelled"] as const).map(
          (key) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatusFilter(key)}
              aria-pressed={statusFilter === key}
              className={
                "whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium capitalize transition-colors " +
                (statusFilter === key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:text-foreground")
              }
            >
              {key}
            </button>
          ),
        )}
      </div>

      <div className="mt-6 space-y-3">
        {orders.length === 0 ? (
          <EmptyState
            icon={ShoppingBasket}
            title="You haven't placed any orders yet."
            description="Browse fresh produce from Nigerian farmers and place your first order."
            action={
              <Button asChild>
                <Link to="/marketplace">Browse marketplace</Link>
              </Button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={ShoppingBasket}
            title={`No ${statusFilter} orders`}
            description="Try a different status filter."
          />
        ) : (
          filtered.map((order) => (
            <Link
              key={order.id}
              to={`/buyer/orders/${order.id}`}
              className="block rounded-xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-display font-semibold">
                    Order #{order.id.slice(-8).toUpperCase()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(order.createdAt)} · Farmer:{" "}
                    {order.farmer?.name ?? "—"}
                  </p>
                </div>
                <StatusBadge status={order.status} />
              </div>
              <div className="mt-3 flex flex-wrap items-end justify-between gap-2">
                <ul className="min-w-0 flex-1 space-y-0.5 text-sm text-muted-foreground">
                  {order.items.map((item, index) => (
                    <li key={index} className="truncate">
                      {item.quantity} {item.unit} — {item.productName}
                    </li>
                  ))}
                </ul>
                <p className="font-display text-lg font-bold">
                  {formatNaira(order.totalAmount)}
                </p>
              </div>
            </Link>
          ))
        )}
      </div>
    </main>
  );
}
