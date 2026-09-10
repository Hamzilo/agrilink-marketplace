import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Loader2, ShoppingCart, Sprout, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useMutation } from "convex/react";
import { useNavigate, useSearchParams } from "react-router";

type RoleChoice = "farmer" | "buyer";

export default function Onboarding() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo");

  const [role, setRole] = useState<RoleChoice | null>(null);
  const [fullName, setFullName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [location, setLocation] = useState(user?.location ?? "");
  const [farmName, setFarmName] = useState("");
  const [farmDescription, setFarmDescription] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const completeOnboarding = useMutation(api.users.completeOnboarding);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!role) {
      setError("Please choose how you'll use AgriLink.");
      return;
    }
    if (!fullName.trim()) return setError("Please enter your full name.");
    if (!phone.trim()) return setError("Please enter your phone number.");
    if (!/^[0-9+\-\s()]{7,20}$/.test(phone.trim())) {
      return setError("Please enter a valid phone number.");
    }
    if (!location.trim()) return setError("Please enter your location.");
    if (role === "farmer" && !farmName.trim()) {
      return setError("Please enter your farm or business name.");
    }

    setSubmitting(true);
    try {
      await completeOnboarding({
        role,
        fullName: fullName.trim(),
        phone: phone.trim(),
        location: location.trim(),
        farmName: role === "farmer" ? farmName.trim() : undefined,
        farmDescription: role === "farmer" ? farmDescription.trim() : undefined,
        businessName: role === "buyer" ? businessName.trim() : undefined,
      });
      // Role-based destination: farmers land on their dashboard, buyers go to
      // the marketplace (their main workspace) unless a returnTo was set.
      const destination =
        returnTo && returnTo.startsWith("/")
          ? returnTo
          : role === "farmer"
            ? "/farmer"
            : "/marketplace";
      navigate(destination, { replace: true });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-7 animate-spin text-primary" />
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-4 py-10">
      <div className="mb-8 text-center">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Set up your AgriLink account
        </h1>
        <p className="mt-2 text-muted-foreground">
          Tell us a little about yourself so we can tailor your experience.
        </p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">I want to…</CardTitle>
          <CardDescription>
            You can always update your details later in your profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role picker */}
            <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Account type">
              <button
                type="button"
                role="radio"
                aria-checked={role === "farmer"}
                onClick={() => setRole("farmer")}
                className={cn(
                  "rounded-xl border p-4 text-left transition-all",
                  role === "farmer"
                    ? "border-primary bg-secondary ring-2 ring-primary/30"
                    : "hover:border-primary/40",
                )}
              >
                <Sprout className="size-6 text-primary" aria-hidden="true" />
                <p className="mt-2 font-display font-semibold">Sell as a farmer</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  List products, receive orders and track sales.
                </p>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={role === "buyer"}
                onClick={() => setRole("buyer")}
                className={cn(
                  "rounded-xl border p-4 text-left transition-all",
                  role === "buyer"
                    ? "border-primary bg-secondary ring-2 ring-primary/30"
                    : "hover:border-primary/40",
                )}
              >
                <ShoppingCart className="size-6 text-primary" aria-hidden="true" />
                <p className="mt-2 font-display font-semibold">Buy produce</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Browse, order and track fresh farm products.
                </p>
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Amina Bello"
                  autoComplete="name"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0803 123 4567"
                  autoComplete="tel"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="location">
                {role === "farmer" ? "Farm location" : "Delivery location"}
              </Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Kaduna, Kaduna State"
                required
              />
            </div>

            {role === "farmer" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="farmName">Farm / business name</Label>
                  <Input
                    id="farmName"
                    value={farmName}
                    onChange={(e) => setFarmName(e.target.value)}
                    placeholder="e.g. Green Fields Farm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="farmDescription">
                    Short farm description{" "}
                    <span className="font-normal text-muted-foreground">(optional)</span>
                  </Label>
                  <Textarea
                    id="farmDescription"
                    value={farmDescription}
                    onChange={(e) => setFarmDescription(e.target.value)}
                    placeholder="What do you grow or raise? Anything buyers should know?"
                    rows={3}
                  />
                </div>
              </>
            )}

            {role === "buyer" && (
              <div className="space-y-1.5">
                <Label htmlFor="businessName">
                  Business / organisation name{" "}
                  <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="businessName"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Mama Nkechi Restaurants"
                />
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" className="h-11 w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Setting up…
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="ml-1 size-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
