"use client";

import React, { useRef, useState, useCallback } from "react";
import { UploadCloud, X, CheckCircle2, Loader2 } from "lucide-react";
import { validateImageFile } from "@/lib/imageValidation";
import { uploadToPinata } from "@/lib/pinata";
import { CropTool } from "@/components/ui/CropTool";

type UploadState = "idle" | "dragging" | "cropping" | "uploading" | "done" | "error";

interface ImageUploaderProps {
  /** Called with the resulting IPFS URI when the upload succeeds */
  onUpload: (uri: string) => void;
  /** Called when the user clears the uploaded image */
  onClear: () => void;
  /** Currently stored URI (passed from parent to show existing state) */
  currentUri?: string;
}

/**
 * Drag-and-drop / file-picker image upload component with crop step.
 *
 * State machine: idle → dragging → cropping → uploading → done | error
 */
export function ImageUploader({ onUpload, onClear, currentUri }: ImageUploaderProps) {
  const [uploadState, setUploadState] = useState<UploadState>(
    currentUri ? "done" : "idle",
  );
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uri, setUri] = useState<string>(currentUri ?? "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isLocked = uploadState === "uploading";

  /** Process a raw File: validate → show crop interface */
  const processFile = useCallback((file: File) => {
    const result = validateImageFile(file);
    if (!result.valid) {
      setValidationError(result.error ?? "Invalid file.");
      setUploadState("idle");
      return;
    }
    setValidationError(null);
    const objectUrl = URL.createObjectURL(file);
    setCropSrc(objectUrl);
    setUploadState("cropping");
  }, []);

  // ── Drag handlers ────────────────────────────────────────────────────────

  const onDragEnter = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      if (isLocked) return;
      e.preventDefault();
      e.stopPropagation();
      setUploadState("dragging");
    },
    [isLocked],
  );

  const onDragLeave = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      if (isLocked) return;
      e.preventDefault();
      e.stopPropagation();
      setUploadState("idle");
    },
    [isLocked],
  );

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      if (isLocked) return;
      e.preventDefault();
      e.stopPropagation();
      setUploadState("idle");
      const file = e.dataTransfer.files?.[0];
      if (file) processFile(file);
    },
    [isLocked, processFile],
  );

  // ── File picker ──────────────────────────────────────────────────────────

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      // Reset value so the same file can be re-selected after clearing
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [processFile],
  );

  // ── Crop callbacks ───────────────────────────────────────────────────────

  const onCropConfirm = useCallback(
    async (blob: Blob) => {
      if (cropSrc) URL.revokeObjectURL(cropSrc);
      setCropSrc(null);
      setUploadState("uploading");
      setUploadError(null);
      try {
        const file = new File([blob], "campaign-image.webp", { type: "image/webp" });
        const ipfsUri = await uploadToPinata(file);
        setUri(ipfsUri);
        setUploadState("done");
        onUpload(ipfsUri);
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : "Upload failed.");
        setUploadState("error");
      }
    },
    [cropSrc, onUpload],
  );

  const onCropCancel = useCallback(() => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    setUploadState("idle");
  }, [cropSrc]);

  // ── Clear ────────────────────────────────────────────────────────────────

  const handleClear = useCallback(() => {
    setUri("");
    setUploadState("idle");
    setValidationError(null);
    setUploadError(null);
    onClear();
  }, [onClear]);

  // ── Render ───────────────────────────────────────────────────────────────

  if (uploadState === "cropping" && cropSrc) {
    return (
      <CropTool
        imageSrc={cropSrc}
        onConfirm={onCropConfirm}
        onCancel={onCropCancel}
        onError={(msg) => {
          setUploadError(msg);
          onCropCancel();
        }}
      />
    );
  }

  if (uploadState === "done" && uri) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 rounded-xl border border-green-700 bg-green-950/30 px-4 py-3">
          <CheckCircle2 size={16} className="text-green-400 shrink-0" />
          <p className="text-xs text-green-300 break-all flex-1">{uri}</p>
          <button
            type="button"
            onClick={handleClear}
            aria-label="Remove image"
            className="text-gray-500 hover:text-red-400 transition shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Drop zone */}
      <div
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onClick={() => !isLocked && fileInputRef.current?.click()}
        role="button"
        tabIndex={isLocked ? -1 : 0}
        aria-label="Upload campaign image"
        aria-disabled={isLocked}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !isLocked) {
            fileInputRef.current?.click();
          }
        }}
        className={[
          "flex flex-col items-center justify-center w-full h-36 rounded-xl border-2 border-dashed transition cursor-pointer",
          uploadState === "dragging"
            ? "border-indigo-400 bg-indigo-950/40"
            : "border-gray-700 hover:border-indigo-500",
          isLocked ? "opacity-50 cursor-not-allowed" : "",
        ].join(" ")}
      >
        {uploadState === "uploading" ? (
          <Loader2 size={24} className="animate-spin text-indigo-400" />
        ) : (
          <>
            <UploadCloud size={24} className="text-gray-500 mb-2" />
            <p className="text-sm text-gray-400">
              Drag &amp; drop or{" "}
              <span className="text-indigo-400 underline">browse</span>
            </p>
            <p className="text-xs text-gray-600 mt-1">PNG, JPG, or WebP — max 5 MB</p>
          </>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={onFileChange}
        disabled={isLocked}
        aria-hidden="true"
      />

      {/* Validation error */}
      {validationError && (
        <p className="text-sm text-red-400">{validationError}</p>
      )}

      {/* Upload error */}
      {uploadState === "error" && uploadError && (
        <p className="text-sm text-red-400">{uploadError}</p>
      )}
    </div>
  );
}
