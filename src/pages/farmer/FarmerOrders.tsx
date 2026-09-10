import { EmptyState, FullPageLoader, StatusBadge } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { api } from "@/convex/_generated/api";
import { formatDateTime, formatNaira } from "@/lib/format";
import { ClipboardList, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NEXT_ACTIONS: Record<
  string,
  { label: string; to: "confirmed" | "processing" | "completed" | "cancelled" }[]
> = {
  pending: [
    { label: "Confirm order", to: "confirmed" },
    { label: "Cancel order", to: "cancelled" },
  ],
  confirmed: [
    { label: "Start processing", to: "processing" },
    { label: "Cancel order", to: "cancelled" },
  ],
  processing: [
    { label: "Mark completed", to: "completed" },
    { label: "Cancel order", to: "cancelled" },
  ],
  completed: [],
  cancelled: [],
};

export default function FarmerOrders() {
  const orders = useQuery(api.orders.getFarmerOrders, {});
  const updateStatus = useMutation(api.orders.updateOrderStatus);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const handleStatus = async (
    orderId: Id<"orders">,
    status: "confirmed" | "processing" | "completed" | "cancelled",
  ) => {
    setBusyOrderId(orderId);
    try {
      await updateStatus({ orderId, status });
      toast.success(`Order marked ${status}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update order.");
    } finally {
      setBusyOrderId(null);
    }
  };

  if (orders === undefined) {
    return <FullPageLoader label="Loading orders…" />;
  }

  const filtered =
    statusFilter === "all"
      ? orders
      : orders.filter((o) => o.status === statusFilter);

  const counts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    confirmed: orders.filter((o) => o.status === "confirmed").length,
    processing: orders.filter((o) => o.status === "processing").length,
    completed: orders.filter((o) => o.status === "completed").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-3xl font-bold tracking-tight">Orders</h1>
      <p className="mt-1 text-muted-foreground">
        Review incoming orders and keep buyers updated as you fulfil them.
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
              {key} ({counts[key]})
            </button>
          ),
        )}
      </div>

      <div className="mt-6 space-y-4">
        {orders.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No orders yet"
            description="Once buyers start ordering your products, orders will show up here with everything you need to fulfil them."
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title={`No ${statusFilter} orders`}
            description="Try a different status filter."
          />
        ) : (
          filtered.map((order) => {
            const actions = NEXT_ACTIONS[order.status] ?? [];
            const busy = busyOrderId === order.id;
            return (
              <Card key={order.id}>
                <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-3">
                  <div>
                    <p className="font-display font-semibold">
                      Order #{order.id.slice(-8).toUpperCase()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(order.createdAt)}
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                </CardHeader>
                <CardContent className="space-y-3 pb-3">
                  {/* Buyer info */}
                  <div className="rounded-lg bg-muted/50 p-3 text-sm">
                    <p className="font-medium">
                      {order.buyer?.name ?? "Buyer"}
                      {order.buyer?.phone && (
                        <span className="ml-2 font-normal text-muted-foreground">
                          · {order.buyer.phone}
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-muted-foreground">
                      Deliver to: {order.deliveryAddress}
                    </p>
                    {order.buyerNote && (
                      <p className="mt-1 italic text-muted-foreground">
                        Note: {order.buyerNote}
                      </p>
                    )}
                  </div>

                  {/* Items */}
                  <ul className="divide-y">
                    {order.items.map((item, index) => (
                      <li
                        key={`${order.id}-${index}`}
                        className="flex items-center justify-between gap-3 py-2 text-sm"
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-medium">
                            {item.productName}
                          </span>
                          <span className="text-muted-foreground">
                            {item.quantity} {item.unit} ×{" "}
                            {formatNaira(item.unitPrice)}
                          </span>
                        </span>
                        <span className="font-semibold">
                          {formatNaira(item.subtotal)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Order total</p>
                    <p className="font-display text-lg font-bold">
                      {formatNaira(order.totalAmount)}
                    </p>
                  </div>
                </CardContent>
                {actions.length > 0 && (
                  <CardFooter className="gap-2 border-t bg-muted/30">
                    <Button
                      size="sm"
                      disabled={busy}
                      onClick={() =>
                        handleStatus(
                          order.id as Id<"orders">,
                          actions[0].to,
                        )
                      }
                    >
                      {actions[0].label}
                    </Button>
                    {actions.length > 1 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" disabled={busy}>
                            More
                            <ChevronDown className="ml-1 size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuLabel className="text-xs">
                            Update status
                          </DropdownMenuLabel>
                          {actions.slice(1).map((action) => (
                            <DropdownMenuItem
                              key={action.to}
                              onClick={() =>
                                handleStatus(order.id as Id<"orders">, action.to)
                              }
                              className={
                                action.to === "cancelled"
                                  ? "text-destructive focus:text-destructive"
                                  : ""
                              }
                            >
                              {action.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </CardFooter>
                )}
              </Card>
            );
          })
        )}
      </div>
    </main>
  );
}
