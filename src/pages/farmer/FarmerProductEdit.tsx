import { ProductForm } from "@/components/farmer/ProductForm";
import { Button } from "@/components/ui/button";
import { EmptyState, FullPageLoader } from "@/components/shared/EmptyState";
import { api } from "@/convex/_generated/api";
import { PackageX } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";
import { ArrowLeft } from "lucide-react";

export default function FarmerProductEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const product = useQuery(
    api.products.getMyProduct,
    id ? { productId: id as Id<"products"> } : "skip",
  );

  const updateProduct = useMutation(api.products.updateProduct);

  if (product === undefined) {
    return <FullPageLoader label="Loading product…" />;
  }

  if (product === null) {
    return (
      <main className="mx-auto max-w-lg px-4 py-20">
        <EmptyState
          icon={PackageX}
          title="Product not found"
          description="It may have been deleted, or it belongs to another farmer."
          action={
            <Button asChild>
              <Link to="/farmer/products">Back to my products</Link>
            </Button>
          }
        />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Button variant="ghost" size="sm" asChild className="mb-2">
        <Link to="/farmer/products">
          <ArrowLeft className="size-4" /> Back to products
        </Link>
      </Button>
      <h1 className="font-display text-3xl font-bold tracking-tight">
        Edit Product
      </h1>
      <p className="mt-1 text-muted-foreground">
        Update details, stock, pricing and availability.
      </p>

      <div className="mt-6">
        <ProductForm
          key={product.id}
          initial={{
            name: product.name,
            description: product.description,
            categorySlug: product.categorySlug,
            price: String(product.price),
            quantity: String(product.quantity),
            unit: product.unit,
            location: product.location,
            status: product.status,
            imageId: product.imageId,
            imageUrl: product.imageUrl,
          }}
          submitLabel="Save changes"
          onCancel={() => navigate("/farmer/products")}
          onSubmit={async (values) => {
            await updateProduct({
              productId: product.id,
              name: values.name,
              description: values.description,
              categorySlug: values.categorySlug,
              price: values.price,
              quantity: values.quantity,
              unit: values.unit,
              location: values.location,
              status: values.status,
              imageId: values.imageId ?? undefined,
            });
            toast.success("Product updated.");
            navigate("/farmer/products");
          }}
        />
      </div>
    </main>
  );
}
