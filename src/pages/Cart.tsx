import { ProductImageFallback } from "@/components/marketplace/ProductCard";
import { EmptyState, StatusBadge } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { formatNaira } from "@/lib/format";
import { Loader2, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";

function makeClientToken() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `tok-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function Cart() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { items, updateQuantity, removeItem, clearCart } = useCart();
  const [placing, setPlacing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const profile = useQuery(api.users.getMyProfile, isAuthenticated ? {} : "skip");
  const placeOrder = useMutation(api.orders.placeOrder);

  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [buyerNote, setBuyerNote] = useState("");
  const [addressTouched, setAddressTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Default the delivery address from the buyer profile once it loads.
  const profileAddress = profile?.buyer?.deliveryAddress ?? "";
  const effectiveAddress = addressTouched ? deliveryAddress : deliveryAddress || profileAddress;
  const effectiveAddressValue = addressTouched
    ? deliveryAddress
    : deliveryAddress || profileAddress;

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
    [items],
  );

  const handlePlaceOrder = async () => {
    setError(null);
    if (!effectiveAddressValue.trim()) {
      setError("Please enter a delivery address.");
      return;
    }
    setPlacing(true);
    try {
      await placeOrder({
        items: items.map((i) => ({
          productId: i.productId as any,
          quantity: i.quantity,
        })),
        deliveryAddress: effectiveAddressValue.trim(),
        buyerNote: buyerNote.trim() || undefined,
        clientToken: makeClientToken(),
      });
      setOrderPlaced(true);
      clearCart();
      toast.success("Order placed! The farmer has been notified.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not place your order.",
      );
      setPlacing(false);
    }
  };

  if (orderPlaced) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-emerald-100">
          <ShoppingCart className="size-8 text-emerald-700" aria-hidden="true" />
        </span>
        <h1 className="mt-5 font-display text-2xl font-bold">Order placed!</h1>
        <p className="mt-2 text-muted-foreground">
          The farmer has been notified and will confirm your order shortly. You
          can track its status from your orders page.
        </p>
        <div className="mt-6 flex gap-2">
          <Button asChild>
            <Link to="/buyer/orders">View my orders</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/marketplace">Keep shopping</Link>
          </Button>
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16">
        <EmptyState
          icon={ShoppingCart}
          title="Your cart is empty"
          description="Browse the marketplace and add fresh farm products to get started."
          action={
            <Button asChild>
              <Link to="/marketplace">Browse marketplace</Link>
            </Button>
          }
        />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Your Cart
        </h1>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => {
            if (confirm("Remove all items from your cart?")) clearCart();
          }}
        >
          <Trash2 className="mr-1 size-4" /> Clear cart
        </Button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        {/* Items */}
        <div className="space-y-3 lg:col-span-3">
          {items.map((item) => (
            <Card key={item.productId} className="pt-0">
              <CardContent className="flex gap-3 p-3 sm:gap-4 sm:p-4">
                <Link
                  to={`/products/${item.productId}`}
                  className="size-20 shrink-0 overflow-hidden rounded-lg bg-secondary sm:size-24"
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ProductImageFallback />
                  )}
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        to={`/products/${item.productId}`}
                        className="block truncate font-semibold hover:text-primary"
                      >
                        {item.name}
                      </Link>
                      <p className="truncate text-xs text-muted-foreground">
                        {item.farmerName} · {item.location}
                      </p>
                      <p className="mt-0.5 text-sm">
                        {formatNaira(item.unitPrice)} / {item.unit}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label={`Remove ${item.name} from cart`}
                      className="rounded p-1 text-muted-foreground hover:text-destructive"
                      onClick={() => removeItem(item.productId)}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="flex items-center rounded-lg border">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        aria-label={`Decrease ${item.name} quantity`}
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity - 1)
                        }
                      >
                        <Minus className="size-3.5" />
                      </Button>
                      <Input
                        type="number"
                        min={1}
                        max={item.maxQuantity}
                        value={item.quantity}
                        aria-label={`${item.name} quantity`}
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10);
                          if (!Number.isNaN(v)) {
                            updateQuantity(item.productId, v);
                          }
                        }}
                        className="h-8 w-12 border-0 p-0 text-center text-sm [appearance:textfield] focus-visible:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        aria-label={`Increase ${item.name} quantity`}
                        disabled={item.quantity >= item.maxQuantity}
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity + 1)
                        }
                      >
                        <Plus className="size-3.5" />
                      </Button>
                    </div>
                    <p className="font-display font-bold">
                      {formatNaira(item.unitPrice * item.quantity)}
                    </p>
                  </div>
                  {item.maxQuantity < 5 && (
                    <p className="mt-1 text-xs text-amber-700">
                      Only {item.maxQuantity} {item.unit} left in stock
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Checkout */}
        <div className="lg:col-span-2">
          <Card className="lg:sticky lg:top-24">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Order summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="deliveryAddress">Delivery address</Label>
                <Textarea
                  id="deliveryAddress"
                  value={effectiveAddress}
                  onChange={(e) => {
                    setAddressTouched(true);
                    setDeliveryAddress(e.target.value);
                  }}
                  placeholder="Street, city, state…"
                  rows={2}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="buyerNote">
                  Note to farmer{" "}
                  <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="buyerNote"
                  value={buyerNote}
                  onChange={(e) => setBuyerNote(e.target.value)}
                  placeholder="e.g. Call when you arrive"
                />
              </div>

              <Separator />
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Subtotal ({items.length} item{items.length > 1 ? "s" : ""})
                  </span>
                  <span className="font-medium">{formatNaira(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className="text-muted-foreground">
                    Arranged with farmer
                  </span>
                </div>
                <div className="flex justify-between pt-1 text-base font-bold">
                  <span>Total</span>
                  <span>{formatNaira(subtotal)}</span>
                </div>
              </div>

              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}

              <Button
                size="lg"
                className="h-12 w-full"
                disabled={placing || items.length === 0}
                onClick={handlePlaceOrder}
              >
                {placing ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Placing order…
                  </>
                ) : (
                  "Place order"
                )}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Items from different farmers are split into separate orders
                automatically.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
