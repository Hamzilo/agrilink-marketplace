import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useImageUpload } from "@/hooks/use-upload";
import { CATEGORY_OPTIONS, UNIT_OPTIONS } from "@/lib/categories";
import { Loader2, MapPin, UploadCloud, X } from "lucide-react";
import { useRef, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export type ProductFormValues = {
  name: string;
  description: string;
  categorySlug: string;
  price: string;
  quantity: string;
  unit: string;
  location: string;
  status: "available" | "unavailable";
  imageId?: string | null;
  imageUrl?: string | null;
};

export function ProductForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<ProductFormValues>;
  submitLabel: string;
  onSubmit: (values: {
    name: string;
    description: string;
    categorySlug: string;
    price: number;
    quantity: number;
    unit: string;
    location: string;
    status: "available" | "unavailable";
    imageId: Id<"_storage"> | null | undefined;
  }) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [categorySlug, setCategorySlug] = useState(
    initial?.categorySlug ?? "",
  );
  const [price, setPrice] = useState(initial?.price ?? "");
  const [quantity, setQuantity] = useState(initial?.quantity ?? "");
  const [unit, setUnit] = useState(initial?.unit ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [available, setAvailable] = useState(initial?.status !== "unavailable");
  const [imageId, setImageId] = useState<Id<"_storage"> | null | undefined>(
    initial?.imageId as Id<"_storage"> | null | undefined,
  );
  const [imageUrl, setImageUrl] = useState<string | null>(
    initial?.imageId ? initial.imageUrl ?? null : null,
  );
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { uploadImage } = useImageUpload();
  const categories = useQuery(api.products.listCategories, {});

  const handleFile = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const id = await uploadImage(file);
      setImageId(id);
      setImageUrl(URL.createObjectURL(file));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Image upload failed. Try again.",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError("Product name is required.");
    if (!description.trim()) return setError("Please add a short description.");
    if (!categorySlug) return setError("Please choose a category.");
    const priceNum = Number(price);
    if (!price || Number.isNaN(priceNum) || priceNum <= 0) {
      return setError("Enter a valid price greater than zero.");
    }
    const quantityNum = Number(quantity);
    if (quantity === "" || Number.isNaN(quantityNum) || quantityNum < 0) {
      return setError("Enter a valid quantity (0 or more).");
    }
    if (!unit) return setError("Please choose a unit.");
    if (!location.trim()) return setError("Location is required.");

    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        categorySlug,
        price: priceNum,
        quantity: quantityNum,
        unit,
        location: location.trim(),
        status: available ? "available" : "unavailable",
        imageId,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save the product.",
      );
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-3">
          <div className="space-y-1.5">
            <Label htmlFor="name">Product name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Fresh Tomatoes"
              maxLength={80}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the product, quality, and anything buyers should know."
              rows={4}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="price">Price (₦ per unit)</Label>
              <Input
                id="price"
                type="number"
                inputMode="decimal"
                min="1"
                step="any"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="1500"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="quantity">Quantity available</Label>
              <Input
                id="quantity"
                type="number"
                inputMode="numeric"
                min="0"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="100"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="category">Category</Label>
              <Select value={categorySlug} onValueChange={setCategorySlug}>
                <SelectTrigger id="category" aria-label="Category">
                  <SelectValue placeholder="Choose category" />
                </SelectTrigger>
                <SelectContent>
                  {(categories ?? CATEGORY_OPTIONS.map((c) => ({ ...c, id: c.slug }))).map(
                    (c: any) => (
                      <SelectItem key={c.slug} value={c.slug}>
                        {c.name}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="unit">Unit</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger id="unit" aria-label="Unit">
                  <SelectValue placeholder="Choose unit" />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_OPTIONS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="location">Location</Label>
            <div className="relative">
              <MapPin
                className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Jos, Plateau State"
                className="pl-9"
                required
              />
            </div>
          </div>
        </div>

        {/* Image + status column */}
        <div className="space-y-5 lg:col-span-2">
          <div className="space-y-1.5">
            <Label>Product image</Label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
            {imageUrl ? (
              <div className="relative overflow-hidden rounded-xl border">
                <img
                  src={imageUrl}
                  alt="Product preview"
                  className="aspect-[4/3] w-full object-cover"
                />
                <button
                  type="button"
                  aria-label="Remove image"
                  className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-background/90 shadow hover:bg-background"
                  onClick={() => {
                    setImageId(null);
                    setImageUrl(null);
                  }}
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed bg-muted/40 text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
              >
                {uploading ? (
                  <Loader2 className="size-6 animate-spin" />
                ) : (
                  <>
                    <UploadCloud className="size-7" aria-hidden="true" />
                    <span className="text-sm font-medium">Upload photo</span>
                    <span className="text-xs">PNG, JPG or WebP · up to 5 MB</span>
                  </>
                )}
              </button>
            )}
          </div>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Label htmlFor="availability" className="text-sm">
                    Available for sale
                  </Label>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Unavailable products are hidden from the marketplace.
                  </p>
                </div>
                <Switch
                  id="availability"
                  checked={available}
                  onCheckedChange={setAvailable}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="submit" className="h-11 flex-1" disabled={submitting || uploading}>
          {submitting ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Saving…
            </>
          ) : (
            submitLabel
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-11"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
