"use client";

import React, { useRef, useState, useCallback } from "react";
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

const ASPECT_RATIO = 16 / 9;

interface CropToolProps {
  imageSrc: string;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
  onError?: (message: string) => void;
}

/**
 * An in-browser image crop tool that enforces a 16:9 aspect ratio.
 * Converts the cropped region to a WebP blob before calling onConfirm.
 */
export function CropTool({ imageSrc, onConfirm, onCancel, onError }: CropToolProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();

  /** Set an initial centered 16:9 crop once the image dimensions are known. */
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
    const centered = centerCrop(
      makeAspectCrop({ unit: "%", width: 90 }, ASPECT_RATIO, w, h),
      w,
      h,
    );
    setCrop(centered);
  }, []);

  const handleConfirm = useCallback(() => {
    const img = imgRef.current;
    if (!img || !crop || !crop.width || !crop.height) {
      onError?.("No crop region selected.");
      return;
    }

    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;

    const pixelCrop = {
      x: crop.x * (crop.unit === "%" ? img.width / 100 : 1) * scaleX,
      y: crop.y * (crop.unit === "%" ? img.height / 100 : 1) * scaleY,
      width: crop.width * (crop.unit === "%" ? img.width / 100 : 1) * scaleX,
      height: crop.height * (crop.unit === "%" ? img.height / 100 : 1) * scaleY,
    };

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(pixelCrop.width);
    canvas.height = Math.round(pixelCrop.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      onError?.("Canvas context unavailable.");
      return;
    }

    ctx.drawImage(
      img,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      canvas.width,
      canvas.height,
    );

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          onError?.("Failed to produce cropped image blob.");
          return;
        }
        onConfirm(blob);
      },
      "image/webp",
      0.9,
    );
  }, [crop, onConfirm, onError]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400">
        Drag to reposition the crop region. The image will be cropped to 16:9.
      </p>

      <div className="flex justify-center">
        <ReactCrop
          crop={crop}
          onChange={(c) => setCrop(c)}
          aspect={ASPECT_RATIO}
          minWidth={80}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={imageSrc}
            alt="Crop preview"
            onLoad={onImageLoad}
            className="max-h-96 max-w-full object-contain"
          />
        </ReactCrop>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-400 hover:text-white transition"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-medium text-white transition"
        >
          Confirm Crop
        </button>
      </div>
    </div>
  );
}
