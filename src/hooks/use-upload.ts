import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Upload an image to Convex storage. Returns the storage id, which callers
 * attach to products/profiles. Validation happens here and again server-side.
 */
export function useImageUpload() {
  const generateUploadUrl = useMutation(api.products.generateUploadUrl);

  async function uploadImage(file: File): Promise<string> {
    if (!file.type.startsWith("image/")) {
      throw new Error("Please choose an image file (PNG, JPG or WebP).");
    }
    if (file.size > MAX_IMAGE_BYTES) {
      throw new Error("Image is too large. Maximum size is 5 MB.");
    }
    const url = await generateUploadUrl();
    const result = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!result.ok) {
      throw new Error("Upload failed. Please try again.");
    }
    const { storageId } = await result.json();
    return storageId as string;
  }

  return { uploadImage };
}
