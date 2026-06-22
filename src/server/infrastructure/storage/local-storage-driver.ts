import { promises as fs } from 'fs';
import path from 'path';
import { env } from '@/lib/env';
import { StorageDriver } from './storage-driver';

export class LocalStorageDriver implements StorageDriver {
  async upload(file: Buffer, key: string, contentType: string): Promise<string> {
    const uploadDir = env.LOCAL_STORAGE_PATH;
    const filePath = path.join(uploadDir, key);
    
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, file);
    
    // Return a local URL path
    return `/uploads/${key}`;
  }

  async delete(key: string): Promise<void> {
    const filePath = path.join(env.LOCAL_STORAGE_PATH, key);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      // Ignore if file doesn't exist
    }
  }

  async getSignedUrl(key: string, expiresIn?: number): Promise<string> {
    // In local dev, just return the direct URL
    return `/uploads/${key}`;
  }
}