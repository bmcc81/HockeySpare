import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

@Injectable()
export class FileStorageService {
  private client: S3Client | null = null;

  private getClient(): S3Client {
    if (this.client) {
      return this.client;
    }

    const endpoint = process.env.FILE_STORAGE_ENDPOINT;
    const accessKeyId = process.env.FILE_STORAGE_ACCESS_KEY_ID;
    const secretAccessKey = process.env.FILE_STORAGE_SECRET_ACCESS_KEY;

    if (!endpoint || !accessKeyId || !secretAccessKey) {
      throw new InternalServerErrorException(
        'File storage is not configured. Set FILE_STORAGE_ENDPOINT, FILE_STORAGE_ACCESS_KEY_ID, and FILE_STORAGE_SECRET_ACCESS_KEY to enable uploads.',
      );
    }

    this.client = new S3Client({
      endpoint,
      region: process.env.FILE_STORAGE_REGION || 'us-east-1',
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: process.env.FILE_STORAGE_FORCE_PATH_STYLE !== 'false',
    });

    return this.client;
  }

  private getBucket(): string {
    const bucket = process.env.FILE_STORAGE_BUCKET;

    if (!bucket) {
      throw new InternalServerErrorException(
        'File storage is not configured. Set FILE_STORAGE_BUCKET to enable uploads.',
      );
    }

    return bucket;
  }

  private getPublicUrlBase(): string {
    const base = process.env.FILE_STORAGE_PUBLIC_URL_BASE;

    if (!base) {
      throw new InternalServerErrorException(
        'File storage is not configured. Set FILE_STORAGE_PUBLIC_URL_BASE to enable uploads.',
      );
    }

    return base.replace(/\/+$/, '');
  }

  isConfigured(): boolean {
    return !!(
      process.env.FILE_STORAGE_ENDPOINT &&
      process.env.FILE_STORAGE_ACCESS_KEY_ID &&
      process.env.FILE_STORAGE_SECRET_ACCESS_KEY &&
      process.env.FILE_STORAGE_BUCKET &&
      process.env.FILE_STORAGE_PUBLIC_URL_BASE
    );
  }

  /**
   * Uploads a file under a namespaced key and returns its public URL. Keys
   * are namespaced by folder (e.g. "tournaments/<id>/logos") so different
   * asset types for the same tournament don't collide.
   */
  async uploadFile(
    folder: string,
    originalName: string,
    body: Buffer,
    contentType: string,
  ): Promise<string> {
    const bucket = this.getBucket();
    const client = this.getClient();

    const safeName = originalName
      .replace(/[^a-zA-Z0-9.\-_]/g, '_')
      .slice(-100);
    const key = `${folder}/${randomUUID()}-${safeName}`;

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );

    return `${this.getPublicUrlBase()}/${bucket}/${key}`;
  }

  async deleteFileByUrl(url: string): Promise<void> {
    const bucket = this.getBucket();
    const prefix = `${this.getPublicUrlBase()}/${bucket}/`;

    if (!url.startsWith(prefix)) {
      // Not one of our objects (e.g. a manually-pasted external URL) -
      // nothing to clean up.
      return;
    }

    const key = url.slice(prefix.length);
    const client = this.getClient();

    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  }
}
