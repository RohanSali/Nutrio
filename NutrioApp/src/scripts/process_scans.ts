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

export interface ImageProcessResult extends ImageUploadResult {
  processingStatus: string | null;
}

export interface ImageAsset {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
}

export async function processImageToBackend(
  image: ImageAsset,
  firebaseUser: {
    getIdToken: () => Promise<string>;
  }
): Promise<ImageProcessResult> {
  if (!firebaseUser) {
    throw new Error("User is not authenticated.");
  }

  const idToken = await firebaseUser.getIdToken();
  const formData = new FormData();

  formData.append("file", {
    uri: image.uri,
    name: image.fileName || `image-${Date.now()}.jpg`,
    type: image.mimeType || "image/jpeg",
  } as any);

  const response = await fetch(`${API_BASE_URL}/api/process_image`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Image processing failed: ${errorText}`);
  }

  return (await response.json()) as ImageProcessResult;
}