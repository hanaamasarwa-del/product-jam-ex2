import { Hono } from "hono";
import type { AppEnv } from "../env";
import { fail } from "../lib/errors";
import {
  IMAGE_BUCKET,
  IMAGE_URL_TTL_SECONDS,
  MAX_IMAGE_BYTES,
  sniffImageType,
} from "../lib/storage";
import { createAdminClient } from "../lib/supabase";

const MAX_MB = MAX_IMAGE_BYTES / 1024 / 1024;

/*
 * Uploading an image.
 *
 * The browser posts a form with one field, `file`. We check it, store it,
 * and return where it went plus a link to show it with.
 *
 * On the size limit: Cloudflare gives each request about 10ms of CPU.
 * Waiting on the network is free, but unpacking the upload is not. We cap
 * at 5 MB and reject anything bigger before unpacking it, so an oversized
 * request costs almost nothing.
 */
export const uploads = new Hono<AppEnv>().post("/", async (c) => {
  // Reject obvious oversize from the header, before reading the body.
  if (Number(c.req.header("Content-Length") ?? 0) > MAX_IMAGE_BYTES) {
    return fail(
      c,
      413,
      "file_too_large",
      `The file is too big. The maximum is ${MAX_MB} MB.`,
    );
  }

  const form = await c.req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return fail(
      c,
      400,
      "missing_file",
      'No file was sent in the "file" field.',
    );
  }
  if (file.size === 0) {
    return fail(c, 400, "empty_file", "The file is empty.");
  }
  // Check the real size too, in case Content-Length was missing or lied.
  if (file.size > MAX_IMAGE_BYTES) {
    return fail(
      c,
      413,
      "file_too_large",
      `The file is too big. The maximum is ${MAX_MB} MB.`,
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());

  // What the file REALLY is. Renaming report.pdf to photo.jpg does not
  // make it an image.
  const type = sniffImageType(bytes);
  if (!type) {
    return fail(
      c,
      415,
      "unsupported_type",
      "Only images can be uploaded (JPEG, PNG, GIF or WebP).",
    );
  }

  // Store it under the uploader's own folder, with a random name.
  const extension = type === "image/jpeg" ? "jpg" : type.replace("image/", "");
  const path = `${c.get("user").id}/${crypto.randomUUID()}.${extension}`;

  const storage = createAdminClient(c.env).storage.from(IMAGE_BUCKET);
  const { error } = await storage.upload(path, bytes, { contentType: type });
  if (error) {
    console.error("upload failed:", error);
    return fail(
      c,
      500,
      "upload_failed",
      "The upload failed. Please try again.",
    );
  }

  // Send back a link too, so the form can show the image straight away.
  const { data } = await storage.createSignedUrl(path, IMAGE_URL_TTL_SECONDS);

  return c.json({ path, url: data?.signedUrl ?? null }, 201);
});
