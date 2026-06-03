import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const REGION = process.env.BOOKY_AWS_REGION || 'eu-west-2';
const BUCKET = process.env.BOOKY_S3_BUCKET || 'robs-booky-data';

function s3Client() {
  const accessKeyId = process.env.BOOKY_AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.BOOKY_AWS_SECRET_ACCESS_KEY;
  return new S3Client({
    region: REGION,
    credentials:
      accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined,
  });
}

function publicUrl(key: string) {
  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Unique key under the images/ prefix to avoid collisions.
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `images/${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeName}`;

    const bytes = Buffer.from(await file.arrayBuffer());

    await s3Client().send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: bytes,
        ContentType: file.type || 'application/octet-stream',
      })
    );

    return NextResponse.json({ url: publicUrl(key) });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
