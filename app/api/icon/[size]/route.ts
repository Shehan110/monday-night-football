import { readFileSync } from "fs"
import path from "path"
import sharp from "sharp"
import { NextRequest } from "next/server"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size } = await params
  const dim = parseInt(size, 10)
  if (![192, 512].includes(dim)) {
    return new Response("Invalid size", { status: 400 })
  }

  const source = path.join(process.cwd(), "public", "images", "mnf-logo.jpeg")
  const buffer = readFileSync(source)

  const png = await sharp(buffer)
    .resize(dim, dim, { fit: "cover" })
    .png()
    .toBuffer()

  return new Response(png, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  })
}
