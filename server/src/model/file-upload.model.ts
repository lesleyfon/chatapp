import crypto from 'node:crypto';
import * as Sentry from '@sentry/node';
import { createClient } from '@supabase/supabase-js';

import { getEnvs } from '../utils/get-envs';

export class FileUploadModel {
  protected supabase;
  SUPABASE_BUCKET_URL = getEnvs().SUPABASE_BUCKET_URL;
  SUPABASE_BUCKET_SECRET = getEnvs().SUPABASE_BUCKET_SECRET;

  constructor() {
    this.supabase = createClient(this.SUPABASE_BUCKET_URL, this.SUPABASE_BUCKET_SECRET);
  }
  /**
   * Uploads an image to the private image bucket.
   * @param file - The image file to upload.
   * @param name - The name of the image file.
   * @returns The uploaded image data.
   */
  uploadImageToPrivateImageBucket(file: Buffer, name: string) {
    const fileExt = name.split('.').pop() || '';
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `private-chat-images/${fileName}`;

    return this.supabase.storage
      .from('private-messages-image-bucket')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })
      .then(({ error, data }) => {
        if (error) {
          Sentry.captureException(error, {
            tags: {
              method: 'uploadImageToPrivateImageBucket',
              error: error.message,
            },
          });
          return null;
        }
        return data;
      })
      .catch((error) => {
        Sentry.captureException(error, {
          tags: {
            method: 'uploadImageToPrivateImageBucket',
          },
        });
        throw error;
      })
      .finally(() => {
        Sentry.captureMessage('Image uploaded to private image bucket', {
          tags: {
            method: 'uploadImageToPrivateImageBucket',
            filePath,
          },
        });
      });
  }
}
