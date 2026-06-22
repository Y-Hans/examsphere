import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl as getAwsSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '@/lib/env';
import { StorageDriver } from './storage-driver';
import { logger } from '@/server/shared/logger';

const log = logger.child({ module: 'OracleObjectStorageDriver' });

export class OracleObjectStorageDriver implements StorageDriver {
  private client: S3Client;
  private bucket: string;

  constructor() {
    const region = env.ORACLE_OBJECT_STORAGE_REGION || 'us-ashburn-1';
    const namespace = env.ORACLE_OBJECT_STORAGE_NAMESPACE;
    this.bucket = env.ORACLE_OBJECT_STORAGE_BUCKET || 'examsphere-uploads';

    if (!namespace || !env.ORACLE_OBJECT_STORAGE_ACCESS_KEY || !env.ORACLE_OBJECT_STORAGE_SECRET_KEY) {
      throw new Error('Oracle Object Storage credentials are not fully configured.');
    }

    this.client = new S3Client({
      region,
      endpoint: `https://${namespace}.compat.objectstorage.${region}.oraclecloud.com`,
      credentials: {
        accessKeyId: env.ORACLE_OBJECT_STORAGE_ACCESS_KEY,
        secretAccessKey: env.ORACLE_OBJECT_STORAGE_SECRET_KEY,
      },
      forcePathStyle: false,
    });
  }

  async upload(file: Buffer, key: string, contentType: string): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file,
        ContentType: contentType,
      });
      
      await this.client.send(command);
      
      // Return the public URL path (assuming public read access or pre-signed URLs are used for access)
      const region = env.ORACLE_OBJECT_STORAGE_REGION || 'us-ashburn-1';
      const namespace = env.ORACLE_OBJECT_STORAGE_NAMESPACE;
      return `https://${namespace}.objectstorage.${region}.oraclecloud.com/n/${namespace}/b/${this.bucket}/o/${encodeURIComponent(key)}`;
    } catch (error) {
      log.error({ error, key }, 'Failed to upload to Oracle Object Storage');
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      await this.client.send(command);
    } catch (error) {
      log.error({ error, key }, 'Failed to delete from Oracle Object Storage');
      throw error;
    }
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      
      return getAwsSignedUrl(this.client, command, { expiresIn });
    } catch (error) {
      log.error({ error, key }, 'Failed to generate signed URL');
      throw error;
    }
  }
}