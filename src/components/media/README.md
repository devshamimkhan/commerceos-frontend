# Shared media uploads

Use the single shared `MediaPicker` from `@/components/media/media-picker` with `open`, `onClose`, `onSelect`, `currentUrl` and `mediaType` (`image`, `video`, `pdf`, `csv`). Persist the selected item's `url` in the owning feature. Do not create feature-specific picker copies.

For custom upload controls, import `uploadFiles`, `uploaderFetch` or `mediaApi` from `@/lib/media-client`. These obtain a short-lived admin token from Express and send requests through the same-origin `/media-service/api/*` rewrite to img-server. Bearer authorization is preserved and no base64 conversion applies, and no signing secret is exposed to the browser. The server enforces size and file-type limits.

Run admin frontend (5000), backend (4000), and img-server (30000). Configure `MEDIA_SERVER_URL` on both frontend and backend (restart Next.js after changing it). The frontend rewrite prevents browser CORS failures. For deployment, configure the HTTPS `MEDIA_SERVER_URL` on backend, `PUBLIC_BASE_URL` and `ALLOWED_ORIGINS` on img-server, and the same `UPLOADER_JWT_SECRET` on both servers.
