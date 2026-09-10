import { EmptyState, FullPageLoader, ProductStatusBadge } from "@/components/shared/EmptyState";
import { ProductImageFallback } from "@/components/marketplace/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/convex/_generated/api";
import { formatNaira, formatPriceUnit } from "@/lib/format";
import {
  Package,
  PackagePlus,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { useMutation, useQuery } from "convex/react";
import type { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function FarmerProducts() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [categorySlug, setCategorySlug] = useState("all");
  const [status, setStatus] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const products = useQuery(api.products.getMyProducts, {
    search,
    categorySlug: categorySlug === "all" ? undefined : categorySlug,
    status: status === "all" ? undefined : status,
  });
  const categories = useQuery(api.products.listCategories, {});

  const deleteProduct = useMutation(api.products.deleteProduct);
  const updateProduct = useMutation(api.products.updateProduct);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProduct({ productId: deleteTarget.id as Id<"products"> });
      toast.success(`"${deleteTarget.name}" deleted.`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete product.");
    } finally {
      setDeleting(false);
    }
  };

  const toggleAvailability = async (product: any) => {
    try {
      await updateProduct({
        productId: product.id,
        name: product.name,
        description: product.description,
        categorySlug:
          categories?.find((c: any) => c.name === product.categoryName)?.slug ??
          "other",
        price: product.price,
        quantity: product.quantity,
        unit: product.unit,
        location: product.location,
        status: product.status === "available" ? "unavailable" : "available",
      });
      toast.success(
        product.status === "available"
          ? "Product hidden from marketplace"
          : "Product is now available",
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update product.");
    }
  };

  const categoriesForFilter = useMemo(
    () => [{ slug: "all", name: "All categories" }, ...(categories ?? [])],
    [categories],
  );

  const loading = products === undefined;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            My Products
          </h1>
          <p className="mt-1 text-muted-foreground">
            Manage your listings, stock and availability.
          </p>
        </div>
        <Button size="lg" asChild>
          <Link to="/farmer/products/new">
            <Plus className="size-4" aria-hidden="true" />
            Add Product
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-col gap-3 md:flex-row">
        <form
          className="relative flex-1"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(searchInput);
          }}
        >
          <Search
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search your products…"
            className="pl-9"
            aria-label="Search your products"
          />
        </form>
        <Select value={categorySlug} onValueChange={setCategorySlug}>
          <SelectTrigger className="w-full md:w-44" aria-label="Filter by category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categoriesForFilter.map((c: any) => (
              <SelectItem key={c.slug} value={c.slug}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full md:w-40" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="unavailable">Unavailable</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6">
        {loading ? (
          <FullPageLoader label="Loading products…" />
        ) : products.length === 0 ? (
          search || categorySlug !== "all" || status !== "all" ? (
            <EmptyState
              icon={Package}
              title="No products match your filters"
              description="Try adjusting the search, category or status filters."
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchInput("");
                    setSearch("");
                    setCategorySlug("all");
                    setStatus("all");
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={PackagePlus}
              title="You haven't added any products yet."
              description="List your first product to start receiving orders from buyers across Nigeria."
              action={
                <Button asChild>
                  <Link to="/farmer/products/new">
                    <Plus className="size-4" /> Add your first product
                  </Link>
                </Button>
              }
            />
          )
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto rounded-xl border bg-card md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span className="size-11 shrink-0 overflow-hidden rounded-lg bg-secondary">
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
                          <span className="font-medium">{product.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {product.categoryName}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatPriceUnit(product.price, product.unit)}
                      </TableCell>
                      <TableCell>
                        {product.quantity} {product.unit}
                      </TableCell>
                      <TableCell>
                        <ProductStatusBadge status={product.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleAvailability(product)}
                          >
                            {product.status === "available" ? "Hide" : "Show"}
                          </Button>
                          <Button variant="ghost" size="icon" asChild>
                            <Link
                              to={`/farmer/products/${product.id}/edit`}
                              aria-label={`Edit ${product.name}`}
                            >
                              <Pencil className="size-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Delete ${product.name}`}
                            className="text-destructive hover:text-destructive"
                            onClick={() =>
                              setDeleteTarget({
                                id: product.id,
                                name: product.name,
                              })
                            }
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile cards */}
            <div className="grid gap-3 md:hidden">
              {products.map((product) => (
                <div key={product.id} className="rounded-xl border bg-card p-3">
                  <div className="flex gap-3">
                    <span className="size-16 shrink-0 overflow-hidden rounded-lg bg-secondary">
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
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.categoryName} · {formatNaira(product.price)}/{product.unit}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {product.quantity} {product.unit} in stock
                      </p>
                      <div className="mt-1.5">
                        <ProductStatusBadge status={product.status} />
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link to={`/farmer/products/${product.id}/edit`}>
                        <Pencil className="size-3.5" /> Edit
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => toggleAvailability(product)}
                    >
                      {product.status === "available" ? "Hide" : "Show"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      aria-label={`Delete ${product.name}`}
                      onClick={() =>
                        setDeleteTarget({ id: product.id, name: product.name })
                      }
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleteTarget?.name}&quot; will be permanently removed from
              AgriLink. This cannot be undone. Orders already placed are not
              affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
            >
              {deleting ? "Deleting…" : "Delete product"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
