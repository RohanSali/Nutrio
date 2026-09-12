import { API_BASE_URL } from "../config/api";

export interface ImageUploadResult {
  success: boolean;
  scanId: string;
  uid?: string;
  fileId: string;
  filePath: string;
  url: string;
  fileName: string;
}

export interface ImageAsset {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
}

export async function uploadImageToBackend(
  image: ImageAsset,
  firebaseUser: {
    getIdToken: () => Promise<string>;
  }
): Promise<ImageUploadResult> {

  if (!firebaseUser) {
    throw new Error("User is not authenticated.");
  }

  // Get Firebase ID token
  const idToken = await firebaseUser.getIdToken();

  // Create multipart form data
  const formData = new FormData();

  formData.append("file", {
    uri: image.uri,

    name:
      image.fileName ||
      `image-${Date.now()}.jpg`,

    type:
      image.mimeType ||
      "image/jpeg",
  } as any);

  // Send image to FastAPI
  const response = await fetch(
    `${API_BASE_URL}/api/images/uploadImage`,
    {
      method: "POST",

      headers: {
        Authorization: `Bearer ${idToken}`,
      },

      body: formData,
    }
  );

  // Handle API errors
  if (!response.ok) {

    const errorText = await response.text();

    throw new Error(
      `Image upload failed: ${errorText}`
    );
  }

  // Parse response
  const result =
    (await response.json()) as ImageUploadResult;

  return result;
}