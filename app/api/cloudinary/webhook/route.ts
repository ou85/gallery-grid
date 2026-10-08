import { createHash, timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.CLOUDINARY_API_SECRET;
  const signature = request.headers.get("x-cld-signature");
  const timestamp = request.headers.get("x-cld-timestamp");
  const body = await request.text();
  if (!secret || !signature || !timestamp) return new NextResponse("Unauthorized", { status: 401 });

  if (!Number.isFinite(Number(timestamp)) || Math.abs(Date.now() / 1000 - Number(timestamp)) > 7_200) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const expected = createHash("sha1").update(`${body}${timestamp}${secret}`).digest("hex");
  if (expected.length !== signature.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const payload = JSON.parse(body) as { asset_folder?: string };
  if (payload.asset_folder === (process.env.CLOUDINARY_GALLERY_FOLDER || "gallery")) {
    revalidateTag("gallery-assets", "max");
  }
  return NextResponse.json({ revalidated: true });
}
