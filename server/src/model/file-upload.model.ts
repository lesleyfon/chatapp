import crypto from 'node:crypto';
import * as Sentry from '@sentry/node';
import { createClient } from '@supabase/supabase-js';

import type { ImageFile } from 'src/types';
import { getEnvs } from '../utils/get-envs';

export class FileUploadModel {
  protected supabase;
  SUPABASE_BUCKET_URL = getEnvs().SUPABASE_BUCKET_URL;
  SUPABASE_BUCKET_SECRET = getEnvs().SUPABASE_BUCKET_SECRET;

  constructor() {
    if (!this.SUPABASE_BUCKET_URL || !this.SUPABASE_BUCKET_SECRET) {
      Sentry.captureMessage('Missing Supabase credentials', {
        level: 'warning',
        tags: { method: 'FileUploadModel constructor' },
      });
    }
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
        Sentry.captureMessage('Image uploaded to private image bucket', {
          tags: {
            method: 'uploadImageToPrivateImageBucket',
            filePath,
          },
        });
        return data;
      })
      .catch((error) => {
        Sentry.captureException(error, {
          tags: {
            method: 'uploadImageToPrivateImageBucket',
          },
        });
        return null;
      });
  }

  /**
   * Uploads an image to the Channel Chat image bucket.
   * @param file - The image file to upload.
   * @param name - The name of the image file.
   * @returns The uploaded image data.
   */
  uploadImageToChannelChatImageBucket(file: Buffer, name: string) {
    const fileExt = name.split('.').pop() || '';
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `channel-chat-images/${fileName}`;

    return this.supabase.storage
      .from('channel-chat-messages-image-bucket')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })
      .then(({ error, data }) => {
        if (error) {
          Sentry.captureException(error, {
            tags: {
              method: 'uploadImageToChannelChatImageBucket',
              error: error.message,
            },
          });
          return null;
        }
        Sentry.captureMessage('Image uploaded to Channel Chat image bucket', {
          level: 'info',
          tags: {
            method: 'uploadImageToChannelChatImageBucket',
            filePath,
          },
        });
        return data;
      })
      .catch((error) => {
        Sentry.captureException(error, {
          tags: {
            method: 'uploadImageToChannelChatImageBucket',
          },
        });
        return null;
      });
  }

  /**
   * @description This function is used to process the image file for storage.
   * @param {Buffer | File | string} imageFile - The image file to process.
   * @returns {Promise<Buffer | null>} The processed image file.
   */
  async processImageForStorage(imageFile: ImageFile): Promise<Buffer | null> {
    if (imageFile instanceof Buffer) {
      return imageFile;
    } else if (imageFile instanceof File) {
      const arrayBuffer = await imageFile.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } else if (typeof imageFile === 'string') {
      const cleanBase64 = imageFile.replace(/^data:image\/\w+;base64,/, '');
      return Buffer.from(cleanBase64, 'base64');
    }
    return null;
  }
}
