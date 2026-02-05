import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "@/lib/firebase";

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || "tenant_demo";

/**
 * Upload a product image to Firebase Storage
 * @param file The image file to upload
 * @param productId The product ID (used for naming the file)
 * @returns The download URL of the uploaded image
 */
export async function uploadProductImage(file: File, productId: string): Promise<string> {
  // Create a unique filename with timestamp to avoid caching issues
  const timestamp = Date.now();
  const extension = file.name.split(".").pop() || "jpg";
  const fileName = `${productId}_${timestamp}.${extension}`;

  const storageRef = ref(storage, `tenants/${TENANT_ID}/products/${fileName}`);

  await uploadBytes(storageRef, file, {
    contentType: file.type,
  });

  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
}

/**
 * Delete a product image from Firebase Storage
 * @param imageUrl The URL of the image to delete
 */
export async function deleteProductImage(imageUrl: string): Promise<void> {
  try {
    // Extract the path from the URL
    const storageRef = ref(storage, imageUrl);
    await deleteObject(storageRef);
  } catch (error) {
    // Ignore errors if the image doesn't exist
    console.warn("Failed to delete product image:", error);
  }
}
