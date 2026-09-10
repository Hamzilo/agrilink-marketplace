import { ProductImageFallback } from "@/components/marketplace/ProductCard";
import { EmptyState, FullPageLoader } from "@/components/shared/EmptyState";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { formatNaira, formatPriceUnit } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  MapPin,
  Minus,
  PackageSearch,
  Plus,
  ShoppingCart,
  Sprout,
  Phone,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useQuery } from "convex/react";
import type { Id } from "@/convex/_generated/dataModel";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const product = useQuery(
    api.products.getProduct,
    id ? { productId: id as Id<"products"> } : "skip",
  );
  const related = useQuery(
    api.products.getRelatedProducts,
    id ? { productId: id as Id<"products">, limit: 4 } : "skip",
  );

  // Reset quantity when a different product loads.
  useEffect(() => {
    setQuantity(1);
    setAdded(false);
  }, [id]);

  if (product === undefined) {
    return <FullPageLoader label="Loading product…" />;
  }

  if (product === null) {
    return (
      <main className="mx-auto max-w-lg px-4 py-20">
        <EmptyState
          icon={PackageSearch}
          title="Product not found"
          description="This product may have been removed by the farmer or the link is incorrect."
          action={
            <Button asChild>
              <Link to="/marketplace">Back to marketplace</Link>
            </Button>
          }
        />
      </main>
    );
  }

  const outOfStock = product.quantity <= 0 || product.status !== "available";
  const maxQuantity = Math.max(product.quantity, 1);
  const clampedQuantity = Math.min(Math.max(quantity, 1), maxQuantity);

  const handleAddToCart = () => {
    if (!isAuthenticated || user?.role !== "buyer") {
      navigate(
        `/auth?returnTo=${encodeURIComponent(`/products/${product.id}`)}`,
      );
      return;
    }
    addItem({
      productId: product.id,
      name: product.name,
      unitPrice: product.price,
      unit: product.unit,
      quantity: clampedQuantity,
      maxQuantity: product.quantity,
      imageUrl: product.imageUrl,
      farmerName: product.farmer.name,
      location: product.location,
    });
    setAdded(true);
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <ol className="flex items-center gap-1.5">
          <li>
            <Link to="/marketplace" className="hover:text-foreground">
              Marketplace
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-foreground/60">{product.categoryName}</li>
          <li aria-hidden="true">/</li>
          <li className="truncate font-medium text-foreground">
            {product.name}
          </li>
        </ol>
      </nav>

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        {/* Image */}
        <div className="overflow-hidden rounded-2xl border bg-secondary">
          <div className="aspect-[4/3]">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <ProductImageFallback />
            )}
          </div>
        </div>

        {/* Info */}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="border">
              {product.categoryName}
            </Badge>
            {outOfStock ? (
              <Badge className="border border-stone-300 bg-stone-100 text-stone-600">
                Unavailable
              </Badge>
            ) : (
              <Badge className="border border-emerald-200 bg-emerald-100 text-emerald-800">
                Available
              </Badge>
            )}
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight">
            {product.name}
          </h1>
          <p className="mt-2 font-display text-2xl font-bold text-primary">
            {formatPriceUnit(product.price, product.unit)}
          </p>

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <MapPin className="size-4" aria-hidden="true" />
              {product.location}
            </span>
            <span className="flex items-center gap-1.5">
              <Sprout className="size-4" aria-hidden="true" />
              {outOfStock ? "Out of stock" : `${formatNaira(product.quantity)} ${product.unit} available`}
            </span>
          </div>

          <p className="mt-5 whitespace-pre-line leading-relaxed text-foreground/90">
            {product.description}
          </p>

          {/* Farmer card */}
          <Card className="mt-6">
            <CardContent className="flex items-center gap-3 p-4">
              <Avatar className="size-11">
                {product.farmer.image ? (
                  <AvatarImage src={product.farmer.image} alt="" />
                ) : null}
                <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                  {(product.farmer.name ?? "F")
                    .split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-semibold">
                  {product.farmer.name}
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {product.farmer.farmName ?? "Verified AgriLink farmer"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quantity + add to cart */}
          <div className="mt-6 rounded-xl border bg-card p-4">
            <label
              htmlFor="quantity"
              className="text-sm font-medium"
            >
              Quantity ({product.unit})
            </label>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex items-center rounded-lg border">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Decrease quantity"
                  disabled={outOfStock || clampedQuantity <= 1}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  <Minus className="size-4" />
                </Button>
                <Input
                  id="quantity"
                  type="number"
                  min={1}
                  max={maxQuantity}
                  value={clampedQuantity}
                  disabled={outOfStock}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10);
                    if (Number.isNaN(value)) return;
                    setQuantity(Math.min(Math.max(value, 1), maxQuantity));
                  }}
                  className="w-16 border-0 text-center [appearance:textfield] focus-visible:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Increase quantity"
                  disabled={outOfStock || clampedQuantity >= maxQuantity}
                  onClick={() =>
                    setQuantity((q) => Math.min(maxQuantity, q + 1))
                  }
                >
                  <Plus className="size-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Subtotal:{" "}
                <span className="font-semibold text-foreground">
                  {formatNaira(product.price * clampedQuantity)}
                </span>
              </p>
            </div>
            {quantity > product.quantity && !outOfStock && (
              <p className="mt-2 text-sm text-destructive" role="alert">
                Only {product.quantity} {product.unit} in stock.
              </p>
            )}
            <Separator className="my-4" />
            {user?.role === "farmer" ? (
              <p className="text-sm text-muted-foreground">
                You are signed in as a farmer — buyer ordering is done from a
                buyer account.
              </p>
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  size="lg"
                  className="flex-1"
                  disabled={outOfStock}
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="size-4" aria-hidden="true" />
                  {outOfStock
                    ? "Out of stock"
                    : added
                      ? "Added — view cart"
                      : isAuthenticated
                        ? "Add to cart"
                        : "Sign in to order"}
                </Button>
                {added && (
                  <Button
                    size="lg"
                    variant="outline"
                    className="flex-1"
                    onClick={() => navigate("/cart")}
                  >
                    Go to cart
                  </Button>
                )}
              </div>
            )}
            <p className="mt-3 text-center text-xs text-muted-foreground sm:text-left">
              Orders are confirmed by the farmer before processing. Payment and
              delivery are arranged directly with the farmer.
            </p>
          </div>
        </div>
      </div>

      {/* Related */}
      {related && related.length > 0 && (
        <section className="mt-14" aria-labelledby="related-heading">
          <h2
            id="related-heading"
            className="font-display text-xl font-bold tracking-tight"
          >
            More in {product.categoryName}
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((rel) => (
              <Link
                key={rel.id}
                to={`/products/${rel.id}`}
                className="group overflow-hidden rounded-xl border bg-card transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="aspect-[4/3] bg-secondary">
                  {rel.imageUrl ? (
                    <img
                      src={rel.imageUrl}
                      alt={rel.name}
                      loading="lazy"
                      className={cn(
                        "h-full w-full object-cover transition-transform duration-300 group-hover:scale-105",
                      )}
                    />
                  ) : (
                    <ProductImageFallback />
                  )}
                </div>
                <div className="p-3">
                  <p className="truncate text-sm font-semibold">{rel.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {rel.farmerName} · {rel.location}
                  </p>
                  <p className="mt-1 text-sm font-bold text-primary">
                    {formatPriceUnit(rel.price, rel.unit)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
