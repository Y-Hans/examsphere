import { env } from '@/lib/env';
import { LocalStorageDriver } from './local-storage-driver';
import { OracleObjectStorageDriver } from './oracle-object-storage-driver';
import { StorageDriver } from './storage-driver';

let storageInstance: StorageDriver;

function getStorageDriver(): StorageDriver {
  if (!storageInstance) {
    if (env.STORAGE_DRIVER === 'oracle') {
      storageInstance = new OracleObjectStorageDriver();
    } else {
      storageInstance = new LocalStorageDriver();
    }
  }
  return storageInstance;
}

export const storage = getStorageDriver();