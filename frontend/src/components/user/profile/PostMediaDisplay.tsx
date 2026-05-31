"use client";

import { isVideoUrl } from "@/lib/cloudinary/upload";

type Variant = "feed" | "modal" | "embed";

type Props = {
  mediaUrl: string;
  alt?: string;
  variant?: Variant;
  className?: string;
};

const maxHeightByVariant: Record<Variant, string> = {
  feed: "max-h-[min(520px,70vh)]",
  embed: "max-h-[360px]",
  modal: "max-h-[min(82vh,900px)]",
};

export default function PostMediaDisplay({
  mediaUrl,
  alt = "post media",
  variant = "feed",
  className = "",
}: Props) {
  const isVideo = isVideoUrl(mediaUrl);
  const maxH = maxHeightByVariant[variant];

  return (
    <div
      className={`flex w-full items-center justify-center bg-slate-100 ${className}`}
    >
      {isVideo ? (
        <video
          src={mediaUrl}
          controls
          className={`${maxH} w-full max-w-full object-contain`}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={mediaUrl}
          alt={alt}
          className={`${maxH} w-auto max-w-full object-contain`}
          loading="lazy"
        />
      )}
    </div>
  );
}
