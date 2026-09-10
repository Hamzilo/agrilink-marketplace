import { ProductForm } from "@/components/farmer/ProductForm";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router";

export default function FarmerProductNew() {
  const navigate = useNavigate();
  const createProduct = useMutation(api.products.createProduct);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Button variant="ghost" size="sm" asChild className="mb-2">
        <Link to="/farmer/products">
          <ArrowLeft className="size-4" /> Back to products
        </Link>
      </Button>
      <h1 className="font-display text-3xl font-bold tracking-tight">
        Add a Product
      </h1>
      <p className="mt-1 text-muted-foreground">
        List a product for buyers on the AgriLink marketplace.
      </p>

      <div className="mt-6">
        <ProductForm
          submitLabel="Publish product"
          onCancel={() => navigate("/farmer/products")}
          onSubmit={async (values) => {
            await createProduct({
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
            toast.success("Product published!");
            navigate("/farmer/products");
          }}
        />
      </div>
    </main>
  );
}
