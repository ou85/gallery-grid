"use client";

import { useEffect, useRef, useState } from "react";
import { modalPreviewUrl } from "@/lib/cloudinary-image-url";

type SelectedImage = {
  originalUrl: string;
  previewUrl: string;
  alt: string;
};

export function ImageLightbox() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState<SelectedImage | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(false);

  useEffect(() => {
    const openImage = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        !(event.target instanceof Element)
      ) return;

      const link = event.target.closest<HTMLAnchorElement>("a[data-gallery-image]");
      if (!link) return;

      event.preventDefault();
      setDownloadError(false);
      setSelected({
        originalUrl: link.href,
        previewUrl: modalPreviewUrl(link.href),
        alt: link.querySelector("img")?.alt || "Gallery image",
      });
    };

    document.addEventListener("click", openImage);
    return () => document.removeEventListener("click", openImage);
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (selected && !dialog?.open) dialog?.showModal();
    if (!selected && dialog?.open) dialog.close();
  }, [selected]);

  const downloadOriginal = async () => {
    if (!selected || downloading) return;

    setDownloading(true);
    setDownloadError(false);
    try {
      const response = await fetch(selected.originalUrl);
      if (!response.ok) throw new Error("Image download failed");

      const objectUrl = URL.createObjectURL(await response.blob());
      const filename = decodeURIComponent(new URL(selected.originalUrl).pathname.split("/").pop() || "image");
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);
    } catch {
      setDownloadError(true);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="image-lightbox"
      aria-label="Image viewer"
      onClose={() => setSelected(null)}
      onClick={(event) => {
        if (event.target === event.currentTarget) setSelected(null);
      }}
    >
      {selected && (
        <div className="image-lightbox-content">
          <div className="image-lightbox-actions">
            <button type="button" onClick={downloadOriginal} disabled={downloading}>
              {downloading ? "Downloading…" : "Download original"}
            </button>
            <button
              type="button"
              className="image-lightbox-close"
              onClick={() => setSelected(null)}
              aria-label="Close image viewer"
            />
          </div>
          {downloadError && (
            <p role="alert">
              Download failed. <a href={selected.originalUrl} target="_blank" rel="noreferrer">Open the original</a> to save it manually.
            </p>
          )}
          <img src={selected.previewUrl} alt={selected.alt} />
        </div>
      )}
    </dialog>
  );
}
