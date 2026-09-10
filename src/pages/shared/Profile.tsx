import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import { useImageUpload } from "@/hooks/use-upload";
import { Loader2, UploadCloud, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";

export default function Profile({ role }: { role: "farmer" | "buyer" }) {
  const { user } = useAuth();
  const profile = useQuery(api.users.getMyProfile, {});

  const updateProfile = useMutation(api.users.updateProfile);
  const updateFarmerProfile = useMutation(api.users.updateFarmerProfile);
  const updateBuyerProfile = useMutation(api.users.updateBuyerProfile);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [farmName, setFarmName] = useState("");
  const [farmDescription, setFarmDescription] = useState("");
  const [farmLocation, setFarmLocation] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageId, setImageId] = useState<Id<"_storage"> | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { uploadImage } = useImageUpload();

  // Hydrate the form once the profile query resolves.
  useEffect(() => {
    if (!profile) return;
    setFullName(profile.user.name ?? "");
    setPhone(profile.user.phone ?? "");
    setLocation(profile.user.location ?? "");
    if (profile.farmer) {
      setFarmName(profile.farmer.farmName);
      setFarmDescription(profile.farmer.farmDescription);
      setFarmLocation(profile.farmer.farmLocation);
    }
    if (profile.buyer) {
      setBusinessName(profile.buyer.businessName);
      setDeliveryAddress(profile.buyer.deliveryAddress);
    }
  }, [profile]);

  const handleFile = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const id = await uploadImage(file);
      setImageId(id);
      setImagePreview(URL.createObjectURL(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) return setError("Name cannot be empty.");
    if (!phone.trim()) return setError("Phone cannot be empty.");
    if (!location.trim()) return setError("Location cannot be empty.");

    setSaving(true);
    try {
      await updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim(),
        location: location.trim(),
        imageId: imageId ?? undefined,
      });

      if (role === "farmer") {
        if (!farmName.trim()) {
          setError("Farm name cannot be empty.");
          setSaving(false);
          return;
        }
        await updateFarmerProfile({
          farmName: farmName.trim(),
          farmDescription: farmDescription.trim(),
          farmLocation: farmLocation.trim() || location.trim(),
        });
      } else {
        await updateBuyerProfile({
          businessName: businessName.trim(),
          deliveryAddress: deliveryAddress.trim() || location.trim(),
        });
      }

      toast.success("Profile saved.");
      setImageId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save profile.");
    } finally {
      setSaving(false);
    }
  };

  if (profile === undefined) {
    return (
      <main className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-7 animate-spin text-primary" />
      </main>
    );
  }

  if (profile === null) {
    return (
      <main className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Please sign in to view your profile.</p>
      </main>
    );
  }

  const displayImage = imagePreview ?? profile.user.image ?? null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-3xl font-bold tracking-tight">Profile</h1>
      <p className="mt-1 text-muted-foreground">
        Manage your account details{role === "farmer" ? " and farm information" : " and delivery information"}.
      </p>

      <form onSubmit={handleSave} className="mt-6 space-y-6">
        {/* Identity card */}
        <Card>
          <CardContent className="p-5">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              <div className="relative">
                <Avatar className="size-20 border">
                  {displayImage ? <AvatarImage src={displayImage} alt="" /> : null}
                  <AvatarFallback className="bg-secondary text-xl font-bold text-primary">
                    {(user?.name ?? "U")
                      .split(" ")
                      .map((p) => p[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  aria-label="Change profile photo"
                  className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow transition-transform hover:scale-105"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <UploadCloud className="size-4" />
                  )}
                </button>
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
              </div>
              <div className="min-w-0 flex-1 text-center sm:text-left">
                <p className="font-display text-lg font-semibold">
                  {user?.name ?? "Your profile"}
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {user?.email}
                </p>
                <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                  <User className="size-3" aria-hidden="true" />
                  {role === "farmer" ? "Farmer account" : "Buyer account"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Basic details</CardTitle>
            <CardDescription>
              Your email is your sign-in method and cannot be changed here.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user?.email ?? ""} disabled />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Role-specific */}
        {role === "farmer" ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Farm details</CardTitle>
              <CardDescription>
                Shown to buyers on your product pages.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="farmName">Farm / business name</Label>
                <Input
                  id="farmName"
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="farmDescription">Farm description</Label>
                <Textarea
                  id="farmDescription"
                  value={farmDescription}
                  onChange={(e) => setFarmDescription(e.target.value)}
                  rows={3}
                  placeholder="What do you grow or raise?"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="farmLocation">Farm location</Label>
                <Input
                  id="farmLocation"
                  value={farmLocation}
                  onChange={(e) => setFarmLocation(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Delivery details</CardTitle>
              <CardDescription>
                Used as your default address at checkout.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="businessName">
                  Business / organisation name{" "}
                  <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="businessName"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="deliveryAddress">Default delivery address</Label>
                <Textarea
                  id="deliveryAddress"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={saving || uploading}>
            {saving ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </div>
      </form>
    </main>
  );
}
