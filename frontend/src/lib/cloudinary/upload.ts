export type CloudinaryUploadResult = {
  secureUrl: string;
  publicId: string;
  resourceType: "image" | "video" | "raw";
};

type CloudinaryUploadApiResponse = {
  secure_url?: string;
  public_id?: string;
  resource_type?: "image" | "video" | "raw";
  error?: { message?: string };
};

export async function uploadToCloudinary(file: File): Promise<CloudinaryUploadResult> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error("Thiếu cấu hình Cloudinary trong .env.local");
  }

  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const res = await fetch(endpoint, {
    method: "POST",
    body: formData,
  });

  const data = (await res.json()) as CloudinaryUploadApiResponse;
  if (!res.ok || !data.secure_url || !data.public_id || !data.resource_type) {
    throw new Error(data.error?.message || "Upload Cloudinary thất bại");
  }

  return {
    secureUrl: data.secure_url,
    publicId: data.public_id,
    resourceType: data.resource_type,
  };
}

export function parseCloudinaryPublicId(
  url?: string | null
): { publicId: string; resourceType: "image" | "video" } | null {
  if (!url || !url.includes("res.cloudinary.com")) return null;
  const clean = url.split("?")[0];
  const segments = clean.split("/");
  const uploadIdx = segments.indexOf("upload");
  if (uploadIdx < 0) return null;

  let pathParts = segments.slice(uploadIdx + 1);
  if (pathParts[0]?.match(/^v\d+$/)) pathParts = pathParts.slice(1);
  const fileName = pathParts.pop();
  if (!fileName) return null;

  const baseName = fileName.replace(/\.[^.]+$/, "");
  const folder = pathParts.join("/");
  const publicId = folder ? `${folder}/${baseName}` : baseName;
  if (!publicId) return null;

  return {
    publicId,
    resourceType: isVideoUrl(url) ? "video" : "image",
  };
}

export async function deleteCloudinaryByUrl(url?: string | null): Promise<void> {
  if (!url || !url.includes("res.cloudinary.com")) return;

  try {
    const { API_URL, apiAuthFetch } = await import("@/lib/api/userApi");
    const res = await apiAuthFetch(`${API_URL}/media/cloudinary/destroy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url,
        kind: isVideoUrl(url) ? "video" : "image",
      }),
    });
    if (!res.ok) {
      console.warn("Cloudinary delete failed:", await res.text());
    }
  } catch (err) {
    console.warn("Cloudinary delete error:", err);
  }
}

export function isVideoUrl(url?: string | null): boolean {
  if (!url) return false;
  const value = url.toLowerCase();
  if (value.includes("/video/upload/")) return true;
  return /\.(mp4|mov|webm|m4v|avi|mkv)(\?|$)/i.test(value);
}
