// Image upload helpers: validation + Cloudinary storage. Used by src/lib/api.ts.
// Credentials come from env: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.
import { v2 as cloudinary } from 'cloudinary';

export class ImageError extends Error {
  status: number;
  constructor(status: number, msg: string) { super(msg); this.status = status; }
}

export const IMAGE_RULES = {
  maxBytes: 5 * 1024 * 1024,
  maxPerItem: Number(process.env.MAX_IMAGES_PER_ITEM || 5),
  folder: 'rewear/clothing-items',
  mimes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  exts: ['jpg', 'jpeg', 'png', 'webp'],
};

type Kind = 'jpeg' | 'png' | 'webp';
export type ValidImage = { buffer: Buffer; name: string; kind: Kind };
export type UploadedImage = { url: string; publicId: string };

const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

// Trust file bytes, not the client's file name or MIME type.
function sniff(b: Buffer): Kind | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpeg';
  if (b.length >= 8 && b.subarray(0, 8).equals(PNG_SIG)) return 'png';
  if (b.length >= 12 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  return null;
}
// Cheap truncation check. Cloudinary does the full decode and rejects anything still broken.
function looksComplete(kind: Kind, b: Buffer): boolean {
  if (kind === 'jpeg') return b.lastIndexOf(Buffer.from([0xff, 0xd9])) > 2;
  if (kind === 'png') return b.lastIndexOf('IEND') !== -1;
  return b.readUInt32LE(4) + 8 <= b.length; // webp: RIFF size field vs real length
}

const isFile = (f: any): f is File => !!f && typeof f === 'object' && typeof f.arrayBuffer === 'function';
const label = (f: any) => String(f?.name || 'file').slice(0, 80);

/** Validate every file. Throws ImageError on the first problem, so a request is all-or-nothing. */
export async function validateImageFiles(files: unknown[], existingCount: number): Promise<ValidImage[]> {
  if (!files.length) throw new ImageError(400, 'No files received. Send images in the "files" field.');
  if (existingCount + files.length > IMAGE_RULES.maxPerItem)
    throw new ImageError(409, `An item can have at most ${IMAGE_RULES.maxPerItem} images (it has ${existingCount}, you sent ${files.length}).`);
  const out: ValidImage[] = [];
  for (const f of files) {
    if (!isFile(f)) throw new ImageError(400, 'Each entry in "files" must be an image file.');
    const ext = (f.name.split('.').pop() || '').toLowerCase();
    if (f.size === 0) throw new ImageError(400, `${label(f)}: file is empty.`);
    if (f.size > IMAGE_RULES.maxBytes) throw new ImageError(413, `${label(f)}: larger than ${IMAGE_RULES.maxBytes / 1024 / 1024} MB.`);
    if (!IMAGE_RULES.mimes.includes(f.type.toLowerCase()) || !IMAGE_RULES.exts.includes(ext))
      throw new ImageError(415, `${label(f)}: only JPG, JPEG, PNG and WebP images are allowed.`);
    const buffer = Buffer.from(await f.arrayBuffer());
    const kind = sniff(buffer);
    if (!kind) throw new ImageError(400, `${label(f)}: not a valid image file.`);
    if (!looksComplete(kind, buffer)) throw new ImageError(400, `${label(f)}: image looks corrupted or cut off.`);
    out.push({ buffer, name: label(f), kind });
  }
  return out;
}

// ---------- Cloudinary ----------
let configured = false;
function cfg() {
  if (configured) return cloudinary;
  const { CLOUDINARY_CLOUD_NAME: cloud_name, CLOUDINARY_API_KEY: api_key, CLOUDINARY_API_SECRET: api_secret } = process.env;
  if (!cloud_name || !api_key || !api_secret) {
    console.error('[images] Cloudinary env vars missing (CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET)');
    throw new ImageError(503, 'Image storage is not configured on the server.');
  }
  cloudinary.config({ cloud_name, api_key, api_secret, secure: true });
  configured = true;
  return cloudinary;
}

function uploadOne(img: ValidImage): Promise<UploadedImage> {
  const c = cfg();
  return new Promise((resolve, reject) => {
    const stream = c.uploader.upload_stream(
      { folder: IMAGE_RULES.folder, resource_type: 'image', allowed_formats: ['jpg', 'png', 'webp'], timeout: 60000 },
      (err, res) => (err || !res ? reject(err || new Error('Empty Cloudinary response')) : resolve({ url: res.secure_url, publicId: res.public_id }))
    );
    stream.end(img.buffer);
  });
}

function toImageError(e: any): ImageError {
  if (e instanceof ImageError) return e;
  console.error('[images] Cloudinary upload failed:', e?.http_code, e?.message || e);
  if (e?.http_code === 400) return new ImageError(400, 'Image storage rejected the file as invalid.');
  return new ImageError(502, 'Image storage upload failed. Please try again.');
}

/** Upload all images. If any one fails, the ones already uploaded are removed again. */
export async function uploadImages(images: ValidImage[]): Promise<UploadedImage[]> {
  const res = await Promise.allSettled(images.map(uploadOne));
  const ok = res.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
  const bad = res.find((r): r is PromiseRejectedResult => r.status === 'rejected');
  if (bad) { await Promise.allSettled(ok.map((u) => destroyImage(u.publicId))); throw toImageError(bad.reason); }
  return ok;
}

/** Delete one asset. Returns true if gone ("not found" counts as gone). Never throws. */
export async function destroyImage(publicId: string): Promise<boolean> {
  if (!publicId.startsWith(IMAGE_RULES.folder + '/')) {
    console.warn('[images] refusing to delete asset outside', IMAGE_RULES.folder, publicId);
    return false;
  }
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const r = await cfg().uploader.destroy(publicId, { resource_type: 'image', invalidate: true });
      if (r.result === 'ok' || r.result === 'not found') return true;
      console.error(`[images] destroy attempt ${attempt} unexpected result for ${publicId}:`, r.result);
    } catch (e: any) { console.error(`[images] destroy attempt ${attempt} failed for ${publicId}:`, e?.message || e); }
  }
  return false;
}
