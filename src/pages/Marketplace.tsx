import { ProductCard } from "@/components/marketplace/ProductCard";
import { EmptyState, FullPageLoader } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { PackageSearch, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";

const PAGE_SIZE = 12;

export default function Marketplace() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "";
  const sort = searchParams.get("sort") ?? "newest";

  const [searchInput, setSearchInput] = useState(search);
  const [cursor, setCursor] = useState<string | null>(null);
  const [accumulated, setAccumulated] = useState<
    { key: string; page: any[]; isDone: boolean; continueCursor: string }[]
  >([]);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  // Reset paging whenever filters change.
  useEffect(() => {
    setCursor(null);
    setAccumulated([]);
  }, [search, category, sort]);

  const args = {
    search: search || undefined,
    categorySlug: category || undefined,
    sort: sort as "newest" | "price_asc" | "price_desc",
    limit: PAGE_SIZE,
    cursor: cursor ?? undefined,
  };

  const result = useMarketplacePage(args, cursor);

  // Key accumulated pages by filter signature so a slow previous query can
  // never bleed results into a new filter combination.
  const filterKey = `${search}|${category}|${sort}`;

  useEffect(() => {
    if (!result) return;
    setAccumulated((prev) => {
      const next = prev.filter(
        (p) =>
          p.key !== filterKey || p.continueCursor !== result.continueCursor,
      );
      return [...next, { key: filterKey, ...result }];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result?.continueCursor, filterKey]);

  const products = useMemo(() => {
    const seen = new Set<string>();
    const merged: any[] = [];
    for (const page of accumulated) {
      if (page.key !== filterKey) continue;
      for (const product of page.page) {
        if (!seen.has(product.id)) {
          seen.add(product.id);
          merged.push(product);
        }
      }
    }
    return merged;
  }, [accumulated, filterKey]);

  const currentPages = accumulated.filter((p) => p.key === filterKey);
  const isLoadingFirstPage = !result && currentPages.length === 0;
  const hasMore =
    currentPages.length > 0
      ? !currentPages[currentPages.length - 1].isDone
      : !result?.isDone;

  const updateParams = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
    }
    setSearchParams(next, { replace: true });
  };

  const categories = useCategories();

  const role = user?.role ?? null;

  return (
    <div className="min-h-screen">
      <section className="border-b bg-secondary/40">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Marketplace
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Fresh agricultural products listed directly by farmers across
            Nigeria.
          </p>
          {role === "farmer" && (
            <div className="mt-4">
              <Button asChild>
                <Link to="/farmer/products/new">List a new product</Link>
              </Button>
            </div>
          )}
          {role === "buyer" && (
            <p className="mt-3 text-sm text-muted-foreground">
              Add items to your cart and check out once — orders are grouped
              per farmer automatically.
            </p>
          )}

          {/* Search + sort */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <form
              className="relative flex-1"
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                updateParams({ q: searchInput });
              }}
            >
              <Search
                className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search products…"
                className="h-11 bg-background pl-9 pr-9"
                aria-label="Search products"
              />
              {searchInput && (
                <button
                  type="button"
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setSearchInput("");
                    updateParams({ q: null });
                  }}
                >
                  <X className="size-4" />
                </button>
              )}
            </form>
            <Select
              value={sort}
              onValueChange={(value) => updateParams({ sort: value })}
            >
              <SelectTrigger
                className="h-11 w-full bg-background sm:w-48"
                aria-label="Sort products"
              >
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="price_asc">Price: low to high</SelectItem>
                <SelectItem value="price_desc">Price: high to low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category chips */}
          <div
            className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1"
            role="group"
            aria-label="Filter by category"
          >
            <CategoryChip
              label="All"
              active={!category}
              onClick={() => updateParams({ category: null })}
            />
            {(categories ?? []).map((c: any) => (
              <CategoryChip
                key={c.slug}
                label={c.name}
                active={category === c.slug}
                onClick={() => updateParams({ category: c.slug })}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {isLoadingFirstPage ? (
          <ProductGridSkeleton />
        ) : products.length === 0 ? (
          <EmptyState
            icon={PackageSearch}
            title="No products available yet."
            description={
              search || category
                ? "No products match your search or filters. Try different keywords or clear the filters."
                : "Farmers haven't listed any products yet. Check back soon — fresh stock arrives all the time."
            }
            action={
              (search || category) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchInput("");
                    setSearchParams({}, { replace: true });
                  }}
                >
                  Clear search & filters
                </Button>
              )
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            {hasMore && (
              <div className="mt-8 text-center">
                <Button
                  variant="outline"
                  onClick={() =>
                    setCursor(
                      currentPages[currentPages.length - 1]?.continueCursor ??
                        result?.continueCursor ??
                        null,
                    )
                  }
                >
                  Load more products
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border bg-card">
          <Skeleton className="aspect-[4/3] w-full rounded-none" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Small hooks to keep the component body readable.
import { useQuery } from "convex/react";

function useMarketplacePage(
  args: {
    search?: string;
    categorySlug?: string;
    sort: "newest" | "price_asc" | "price_desc";
    limit: number;
    cursor?: string;
  },
  cursor: string | null,
) {
  // useQuery re-subscribes whenever args change, giving us live updates.
  const result = useQuery(
    api.products.listProducts,
    cursor ? args : { ...args, cursor: undefined },
  );
  return result as
    | { page: any[]; isDone: boolean; continueCursor: string }
    | undefined;
}

function useCategories() {
  return useQuery(api.products.listCategories, {});
}
