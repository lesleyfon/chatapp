/**
 * 1. Select all data from private_messages that have  image_file and do not have an image_url
2. Iterate through the return data, 
3. Upload the data to supabase. 
4. Get the full filepath and update the private_messages image_url cell with the full filepath
 */

const pkg = require('pg');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('node:crypto');
const { Client } = pkg;

function getEnvs() {
  // COPY VALS FROM ENV
  return {
    DATABASE_URL: process.env.DATABASE_URL,
    SUPABASE_BUCKET_URL: process.env.SUPABASE_BUCKET_URL,
    SUPABASE_BUCKET_SECRET: process.env.SUPABASE_BUCKET_SECRET,
  };
}

const { DATABASE_URL, SUPABASE_BUCKET_URL, SUPABASE_BUCKET_SECRET } = getEnvs();

const supabase = createClient(SUPABASE_BUCKET_URL, SUPABASE_BUCKET_SECRET);
const client = new Client({
  connectionString: DATABASE_URL,
});

// Revised upload function
async function uploadImageToPrivateImageBucket(file, name, id) {
  const fileExt = name.split('.').pop() || '';

  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = `private-chat-images/${fileName}`;

  try {
    const { data: uploadResponse, error: uploadError } = await supabase.storage
      .from('private-messages-image-bucket')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });
    // biome-ignore lint/suspicious/noConsole: <explanation>
    console.log({ uploadResponse });

    if (uploadError) {
      // biome-ignore lint/suspicious/noConsole: <explanation>
      console.error(`Supabase upload error for ID ${id} (${name}):`, uploadError);
      return { id, success: false, error: uploadError, imageUrl: null };
    }

    // Construct the public URL
    const { data: publicUrlData } = supabase.storage
      .from('private-messages-image-bucket')
      .getPublicUrl(filePath);

    if (!publicUrlData || !publicUrlData.publicUrl) {
      // biome-ignore lint/suspicious/noConsole: <explanation>
      console.error(`Could not get public URL for ID ${id} (${filePath})`);
      return {
        id,
        success: false,
        error: new Error('Failed to get public URL'),
        imageUrl: null,
      };
    }

    return {
      id,
      success: true,
      imageUrl: publicUrlData.publicUrl,
      error: null,
    };
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: <explanation>
    console.error(
      `Unexpected error in uploadImageToPrivateImageBucket for ID ${id} (${name}):`,
      error,
    );
    return { id, success: false, error, imageUrl: null };
  }
}

(async () => {
  await client.connect();

  try {
    const data = await client.query(
      `SELECT *
        FROM private_messages
        WHERE image_file IS NOT NULL
          AND (image_url IS NULL OR image_url = '');
`,
    );
    // biome-ignore lint/suspicious/noConsole: <explanation>
    console.log({ rows: data.rows });
    const rows = data.rows;

    const allPromises = rows.map((mapData) => {
      const { image_file, image_name, id } = mapData;
      return uploadImageToPrivateImageBucket(image_file, image_name, id);
    });

    const rowsPromise = await Promise.all(allPromises);
    const successfulUploads = rowsPromise.filter((result) => result && result.success);

    // biome-ignore lint/suspicious/noConsole: <explanation>
    console.log({ successfulUploads });

    if (successfulUploads.length > 0) {
      const updatePromises = successfulUploads.map((upload) => {
        // 'upload.imageUrl' now holds the full public URL
        return client
          .query(`UPDATE private_messages SET image_url = $1 WHERE id = $2`, [
            upload.imageUrl,
            upload.id,
          ])
          .catch((updateError) => {
            // biome-ignore lint/suspicious/noConsole: <explanation>
            console.error(
              `Failed to update DB for ID ${upload.id} with URL ${upload.imageUrl}:`,
              updateError,
            );
          });
      });
      const updatedRows = await Promise.all(updatePromises);

      // biome-ignore lint/suspicious/noConsole: <explanation>
      console.log({ updatedRows });
    } else {
      // biome-ignore lint/suspicious/noConsole: <explanation>
      console.log('No images were successfully uploaded to update.');
    }
    await client.end();
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: <explanation>
    console.error(error);
  }
})();
