import { createHash, timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { getCloudinaryFolder } from "@/lib/cloudinary-folder";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 1024 * 1024;
const SIGNATURE_MAX_AGE_SECONDS = 2 * 60 * 60;

async function readBody(request: Request): Promise<Buffer | null> {
  if (!request.body) return Buffer.alloc(0);

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return Buffer.concat(chunks, size);

      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        void reader.cancel().catch(() => {});
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
}

export async function POST(request: Request) {
  const secret = process.env.CLOUDINARY_API_SECRET;
  const signature = request.headers.get("x-cld-signature");
  const timestamp = request.headers.get("x-cld-timestamp");
  if (!secret || !signature || !/^[0-9a-f]{40}$/i.test(signature) || !timestamp || !/^\d+$/.test(timestamp)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > SIGNATURE_MAX_AGE_SECONDS) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  if (Number(request.headers.get("content-length")) > MAX_BODY_BYTES) {
    return new NextResponse("Payload Too Large", { status: 413 });
  }

  let body: Buffer | null;
  try {
    body = await readBody(request);
  } catch {
    return new NextResponse("Could not read request body", { status: 400 });
  }
  if (body === null) return new NextResponse("Payload Too Large", { status: 413 });

  const expected = createHash("sha1").update(body).update(timestamp).update(secret).digest();
  if (!timingSafeEqual(expected, Buffer.from(signature, "hex"))) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(body));
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 });
  }
  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    return new NextResponse("Expected a JSON object", { status: 400 });
  }

  const { folder, lookup } = getCloudinaryFolder();
  const revalidated = lookup === "public-id-prefix"
    ? "public_id" in payload && typeof payload.public_id === "string" && payload.public_id.startsWith(folder + "/")
    : "asset_folder" in payload && payload.asset_folder === folder;

  if (revalidated) revalidateTag("gallery-assets", "max");
  return NextResponse.json({ revalidated });
}
