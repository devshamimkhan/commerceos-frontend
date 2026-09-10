# Shared media uploads

Use `MediaPicker` from `@/components/media/media-picker` with `open`, `onClose`, `onSelect`, `currentUrl` and `mediaType` (`image`, `video`, `pdf`, `csv`). Persist the selected item's `url` in the owning feature.

For custom upload controls, import `uploadFiles`, `uploaderFetch` or `mediaApi` from `@/lib/media-client`. These obtain a short-lived admin token from Express and upload multipart files directly to img-server. No Next API body limit or base64 conversion applies, and no signing secret is exposed to the browser. The server enforces size and file-type limits.

Run frontend (3000), backend (4000), and img-server (30000). For deployment, configure the browser-accessible HTTPS `MEDIA_SERVER_URL` on backend, `PUBLIC_BASE_URL` and `ALLOWED_ORIGINS` on img-server, and the same `UPLOADER_JWT_SECRET` on both servers.
