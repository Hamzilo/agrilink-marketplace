import { EmptyState, FullPageLoader, StatusBadge } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { api } from "@/convex/_generated/api";
import { formatDateTime, formatNaira } from "@/lib/format";
import { ArrowLeft, PackageOpen } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router";
import { useMutation, useQuery } from "convex/react";
import type { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

const STATUS_STEPS = ["pending", "confirmed", "processing", "completed"] as const;

export default function BuyerOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const order = useQuery(
    api.orders.getOrder,
    id ? { orderId: id as Id<"orders"> } : "skip",
  );
  const updateStatus = useMutation(api.orders.updateOrderStatus);
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    if (!order) return;
    if (!confirm("Cancel this order? The farmer will be notified.")) return;
    setCancelling(true);
    try {
      await updateStatus({ orderId: order.id as Id<"orders">, status: "cancelled" });
      toast.success("Order cancelled.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not cancel order.");
    } finally {
      setCancelling(false);
    }
  };

  if (order === undefined) {
    return <FullPageLoader label="Loading order…" />;
  }

  if (order === null) {
    return (
      <main className="mx-auto max-w-lg px-4 py-20">
        <EmptyState
          icon={PackageOpen}
          title="Order not found"
          description="This order doesn't exist or belongs to another account."
          action={
            <Button asChild>
              <Link to="/buyer/orders">Back to my orders</Link>
            </Button>
          }
        />
      </main>
    );
  }

  const currentStep = STATUS_STEPS.indexOf(
    order.status as (typeof STATUS_STEPS)[number],
  );
  const isCancelled = order.status === "cancelled";

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Button variant="ghost" size="sm" asChild className="mb-2">
        <Link to="/buyer/orders">
          <ArrowLeft className="size-4" /> Back to orders
        </Link>
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Order #{order.id.slice(-8).toUpperCase()}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Placed {formatDateTime(order.createdAt)}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Progress */}
      <Card className="mt-6">
        <CardContent className="p-5">
          {isCancelled ? (
            <p className="text-sm font-medium text-destructive">
              This order was cancelled. Any reserved stock has been returned.
            </p>
          ) : (
            <ol className="flex items-center">
              {STATUS_STEPS.map((step, index) => {
                const done = index <= currentStep;
                const isCurrent = index === currentStep;
                return (
                  <li key={step} className="flex flex-1 items-center last:flex-none">
                    <div className="flex flex-col items-center">
                      <span
                        className={
                          "flex size-8 items-center justify-center rounded-full border-2 text-xs font-bold capitalize " +
                          (done
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background text-muted-foreground")
                        }
                        aria-current={isCurrent ? "step" : undefined}
                      >
                        {index + 1}
                      </span>
                      <span
                        className={
                          "mt-1.5 text-[11px] font-medium capitalize " +
                          (done ? "text-foreground" : "text-muted-foreground")
                        }
                      >
                        {step}
                      </span>
                    </div>
                    {index < STATUS_STEPS.length - 1 && (
                      <span
                        className={
                          "mx-1 -mt-5 h-0.5 flex-1 " +
                          (index < currentStep ? "bg-primary" : "bg-border")
                        }
                        aria-hidden="true"
                      />
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6 md:grid-cols-5">
        {/* Items */}
        <Card className="md:col-span-3">
          <CardContent className="p-5">
            <h2 className="font-display font-semibold">Items</h2>
            <ul className="mt-3 divide-y">
              {order.items.map((item, index) => (
                <li key={index} className="flex justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.productName}</p>
                    <p className="text-muted-foreground">
                      {item.quantity} {item.unit} × {formatNaira(item.unitPrice)}
                    </p>
                  </div>
                  <p className="whitespace-nowrap font-semibold">
                    {formatNaira(item.subtotal)}
                  </p>
                </li>
              ))}
            </ul>
            <Separator className="my-3" />
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>{formatNaira(order.totalAmount)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Delivery */}
        <div className="space-y-6 md:col-span-2">
          <Card>
            <CardContent className="p-5 text-sm">
              <h2 className="font-display font-semibold">Delivery</h2>
              <p className="mt-2 text-muted-foreground">
                {order.deliveryAddress}
              </p>
              {order.buyerNote && (
                <p className="mt-2 italic text-muted-foreground">
                  Note: {order.buyerNote}
                </p>
              )}
              <Separator className="my-3" />
              <p className="font-medium">Farmer</p>
              <p className="mt-1 text-muted-foreground">
                {order.farmer?.name ?? "—"}
                {order.farmer?.phone ? ` · ${order.farmer.phone}` : ""}
              </p>
            </CardContent>
          </Card>

          {order.status === "pending" && (
            <Button
              variant="outline"
              className="w-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={cancelling}
              onClick={handleCancel}
            >
              {cancelling ? "Cancelling…" : "Cancel order"}
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
