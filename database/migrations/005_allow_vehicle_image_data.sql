-- Vehicle images from the current frontend are data URLs/base64, which are
-- much larger than a normal URL. MEDIUMTEXT supports up to 16 MB.
ALTER TABLE vehicles MODIFY COLUMN image_url MEDIUMTEXT NULL;
