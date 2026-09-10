import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { formatPriceUnit } from "@/lib/format";
import { MapPin, ShoppingCart, Sprout, Eye } from "lucide-react";
import { Link, useNavigate } from "react-router";

export type MarketplaceProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  unit: string;
  location: string;
  status: string;
  imageUrl: string | null;
  categoryName: string;
  farmerId: string;
  farmerName: string;
};

export function ProductImageFallback({ className }: { className?: string }) {
  return (
    <div
      className={
        "flex h-full w-full items-center justify-center bg-secondary " +
        (className ?? "")
      }
    >
      <Sprout className="size-10 text-primary/30" aria-hidden="true" />
    </div>
  );
}

export function ProductCard({ product }: { product: MarketplaceProduct }) {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { isAuthenticated, user } = useAuth();
  const outOfStock = product.quantity <= 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;
    if (!isAuthenticated || user?.role !== "buyer") {
      navigate(`/auth?returnTo=${encodeURIComponent(`/products/${product.id}`)}`);
      return;
    }
    addItem({
      productId: product.id,
      name: product.name,
      unitPrice: product.price,
      unit: product.unit,
      quantity: 1,
      maxQuantity: product.quantity,
      imageUrl: product.imageUrl,
      farmerName: product.farmerName,
      location: product.location,
    });
    navigate("/cart");
  };

  return (
    <Card className="group flex h-full flex-col overflow-hidden pt-0 transition-all hover:-translate-y-0.5 hover:shadow-lg">
      <Link
        to={`/products/${product.id}`}
        className="relative block aspect-[4/3] overflow-hidden bg-secondary"
        aria-label={`View ${product.name}`}
      >
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <ProductImageFallback />
        )}
        <Badge
          variant="secondary"
          className="absolute left-3 top-3 border bg-background/90 backdrop-blur"
        >
          {product.categoryName}
        </Badge>
      </Link>
      <CardContent className="flex flex-1 flex-col gap-1.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <Link
            to={`/products/${product.id}`}
            className="line-clamp-2 font-display text-base font-semibold leading-snug hover:text-primary"
          >
            {product.name}
          </Link>
          <p className="whitespace-nowrap font-display text-sm font-bold text-harvest-foreground">
            <span className="text-primary">{formatPriceUnit(product.price, product.unit)}</span>
          </p>
        </div>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{product.location}</span>
        </p>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <Sprout className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{product.farmerName}</span>
        </p>
        <div className="mt-auto pt-2">
          {outOfStock ? (
            <Badge variant="outline" className="border-stone-300 bg-stone-100 text-stone-600">
              Out of stock
            </Badge>
          ) : (
            <p className="text-xs font-medium text-emerald-700">
              {product.quantity.toLocaleString()} {product.unit} available
            </p>
          )}
        </div>
      </CardContent>
      <CardFooter className="gap-2 border-t bg-muted/30 p-3">
        <Button asChild variant="outline" size="sm" className="flex-1">
          <Link to={`/products/${product.id}`}>
            <Eye className="size-4" aria-hidden="true" />
            View
          </Link>
        </Button>
        <Button
          size="sm"
          className="flex-1"
          disabled={outOfStock}
          onClick={handleQuickAdd}
        >
          <ShoppingCart className="size-4" aria-hidden="true" />
          {outOfStock ? "Sold out" : "Add to cart"}
        </Button>
      </CardFooter>
    </Card>
  );
}
