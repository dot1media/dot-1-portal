import { S3Client, PutObjectCommand, GetObjectCommand, HeadBucketCommand, DeleteObjectCommand, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const ACCOUNT = process.env.R2_ACCOUNT_ID;
const BUCKET = process.env.R2_BUCKET;
const KEY = process.env.R2_ACCESS_KEY_ID;
const SECRET = process.env.R2_SECRET_ACCESS_KEY;

export function r2Configured(): boolean { return !!(ACCOUNT && BUCKET && KEY && SECRET); }
export function r2Bucket(): string { return BUCKET || ""; }

let _client: S3Client | null = null;
function client(): S3Client {
  if (_client) return _client;
  _client = new S3Client({
    region: "auto",
    endpoint: `https://${ACCOUNT}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: KEY as string, secretAccessKey: SECRET as string },
  });
  return _client;
}

// Short-lived URL the browser PUTs a file straight to (keeps big media out of our functions)
export async function presignPut(key: string, contentType: string, expiresIn = 900): Promise<string> {
  return getSignedUrl(client(), new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType }), { expiresIn });
}
// Short-lived URL the client streams/downloads from
export async function presignGet(key: string, expiresIn = 3600, downloadName?: string): Promise<string> {
  const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: key, ...(downloadName ? { ResponseContentDisposition: `attachment; filename="${downloadName.replace(/"/g, "")}"` } : {}) });
  return getSignedUrl(client(), cmd, { expiresIn });
}
export async function putObject(key: string, body: Uint8Array, contentType: string): Promise<void> {
  await client().send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: body, ContentType: contentType }));
}
export async function deleteObject(key: string): Promise<void> {
  try { await client().send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key })); } catch {}
}
export async function createMultipart(key: string, contentType: string): Promise<string> {
  const r = await client().send(new CreateMultipartUploadCommand({ Bucket: BUCKET, Key: key, ContentType: contentType }));
  return r.UploadId as string;
}
export async function presignPart(key: string, uploadId: string, partNumber: number, expiresIn = 21600): Promise<string> {
  return getSignedUrl(client(), new UploadPartCommand({ Bucket: BUCKET, Key: key, UploadId: uploadId, PartNumber: partNumber }), { expiresIn });
}
export async function completeMultipart(key: string, uploadId: string, parts: { PartNumber: number; ETag: string }[]): Promise<void> {
  await client().send(new CompleteMultipartUploadCommand({ Bucket: BUCKET, Key: key, UploadId: uploadId, MultipartUpload: { Parts: parts.sort((a, b) => a.PartNumber - b.PartNumber) } }));
}
export async function abortMultipart(key: string, uploadId: string): Promise<void> {
  try { await client().send(new AbortMultipartUploadCommand({ Bucket: BUCKET, Key: key, UploadId: uploadId })); } catch {}
}
export async function checkR2(): Promise<{ configured: boolean; ok: boolean; bucket?: string; error?: string }> {
  if (!r2Configured()) return { configured: false, ok: false, error: "R2_ACCOUNT_ID / R2_BUCKET / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY not all set" };
  try { await client().send(new HeadBucketCommand({ Bucket: BUCKET })); return { configured: true, ok: true, bucket: BUCKET }; }
  catch (e: any) { return { configured: true, ok: false, bucket: BUCKET, error: e?.name || e?.message || "connection failed" }; }
}
