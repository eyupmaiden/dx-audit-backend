import { promises as fs } from "fs";
import path from "path";
import axios from "axios";
import sharp from "sharp";
import { getImageConfig, getImageTypeFromField } from "./imageConfig.js";

class ImageDownloader {
  constructor(outputDir) {
    this.outputDir = outputDir;
    this.assetsDir = path.join(outputDir, "assets");
    this.imagesDir = path.join(this.assetsDir, "img");
  }

  async ensureAssetsDirectory() {
    // No longer needed - we only save to client folders
    return;
  }

  getClientImagesDir(client) {
    const cleanClient = client ? client.toLowerCase().replace(/[^a-z0-9]/g, "-") : "unknown";
    const clientDir = path.join(this.outputDir, cleanClient, "assets", "img");
    return clientDir;
  }

  generateDescriptiveFilename(originalFilename, client, fieldName, index = 0) {
    // Clean client name for filename
    const cleanClient = client ? client.toLowerCase().replace(/[^a-z0-9]/g, "-") : "unknown";

    // Map field names to descriptive prefixes
    const fieldPrefixes = {
      "Discovery Phase Screenshots": "discovery",
      "Decision Phase Screenshots": "decision",
      "Conversion Phase Screenshots": "conversion",
      "Eyequant Screenshot": "eyequant",
    };

    const prefix = fieldPrefixes[fieldName] || "screenshot";

    // Get file extension from original filename
    const extension = path.extname(originalFilename).toLowerCase();

    // Generate descriptive name
    let descriptiveName = `${cleanClient}-${prefix}`;

    // Add index if multiple images in same field
    if (index > 0) {
      descriptiveName += `-${index + 1}`;
    }

    // Add extension
    descriptiveName += extension;

    return descriptiveName;
  }

  async optimizeImage(imageBuffer, filename, imageType = "default") {
    try {
      const config = getImageConfig(imageType);
      console.log(`🔧 Optimizing ${filename} with ${imageType} settings...`);

      let sharpInstance = sharp(imageBuffer);

      // Get image metadata
      const metadata = await sharpInstance.metadata();
      const originalSize = Math.round(imageBuffer.length / 1024);
      console.log(`   Original: ${metadata.width}x${metadata.height}, ${originalSize}KB`);

      // Resize image
      sharpInstance = sharpInstance.resize({
        width: config.maxWidth,
        height: config.maxHeight,
        fit: config.fit,
        background: config.background,
      });

      // Convert format and set quality
      if (config.format === "jpeg" || config.format === "jpg") {
        sharpInstance = sharpInstance.jpeg({ quality: config.quality });
      } else if (config.format === "png") {
        sharpInstance = sharpInstance.png({ quality: config.quality });
      } else if (config.format === "webp") {
        sharpInstance = sharpInstance.webp({ quality: config.quality });
      }

      // Process the image
      const optimizedBuffer = await sharpInstance.toBuffer();
      const optimizedSize = Math.round(optimizedBuffer.length / 1024);
      const reduction = Math.round((1 - optimizedBuffer.length / imageBuffer.length) * 100);

      console.log(`   Optimized: ${optimizedSize}KB (${reduction}% reduction)`);

      return optimizedBuffer;
    } catch (error) {
      console.error(`❌ Failed to optimize ${filename}:`, error.message);
      // Return original buffer if optimization fails
      return imageBuffer;
    }
  }

  async downloadImage(imageUrl, filename, fieldName = "", client = "", index = 0) {
    try {
      console.log(`📥 Downloading image: ${filename}`);

      // Download the image
      const response = await axios.get(imageUrl, {
        responseType: "arraybuffer",
        timeout: 30000, // 30 second timeout
      });

      const imageBuffer = Buffer.from(response.data);

      // Generate descriptive filename
      const descriptiveFilename = this.generateDescriptiveFilename(filename, client, fieldName, index);

      // Determine image type based on field name
      const imageType = getImageTypeFromField(fieldName);

      // Optimize the image
      const optimizedBuffer = await this.optimizeImage(imageBuffer, descriptiveFilename, imageType);

      // Save only to client-specific folder
      const clientImagesDir = this.getClientImagesDir(client);
      await fs.mkdir(clientImagesDir, { recursive: true });
      const clientOutputPath = path.join(clientImagesDir, descriptiveFilename);
      await fs.writeFile(clientOutputPath, optimizedBuffer);

      console.log(`✅ Downloaded and optimized: ${descriptiveFilename}`);

      return {
        originalUrl: imageUrl,
        localPath: `assets/img/${descriptiveFilename}`,
        filename: descriptiveFilename,
        fieldName,
        client,
        index,
      };
    } catch (error) {
      console.error(`❌ Failed to download ${filename}:`, error.message);
      return null;
    }
  }

  sanitizeFilename(filename) {
    // Remove or replace invalid characters
    return filename.replace(/[<>:"/\\|?*]/g, "_");
  }

  async downloadAllImages(records) {
    // No longer need to ensure main assets directory

    const downloadedImages = [];
    let totalOriginalSize = 0;
    let totalOptimizedSize = 0;

    for (const record of records) {
      const client = (record.fields?.Client || record.Client || "Unknown").trim();
      const recordId = record.id;

      // Process each field that might contain images
      const imageFields = [
        "Discovery Phase Screenshots",
        "Decision Phase Screenshots",
        "Conversion Phase Screenshots",
        "Eyequant Screenshot",
      ];

      for (const fieldName of imageFields) {
        const fieldValue = record.fields?.[fieldName] || record[fieldName];

        if (!fieldValue) continue;

        // Handle both string URLs and Airtable attachment arrays
        let imageUrls = [];

        if (typeof fieldValue === "string") {
          // Split by comma if multiple URLs in one field
          imageUrls = fieldValue.split(",").map((url) => url.trim());
        } else if (Array.isArray(fieldValue)) {
          // Airtable attachment format
          imageUrls = fieldValue.map((attachment) => attachment.url);
        }

        // Download each image in the field
        for (let i = 0; i < imageUrls.length; i++) {
          const imageUrl = imageUrls[i];
          if (!imageUrl) continue;

          const originalFilename = this.sanitizeFilename(imageUrl.split("/").pop() || `image-${i}.png`);

          const result = await this.downloadImage(imageUrl, originalFilename, fieldName, client, i);

          if (result) {
            downloadedImages.push(result);

            // Track sizes for summary
            const originalSize = Math.round(Buffer.byteLength(imageUrl) / 1024);
            const optimizedSize = Math.round(result.localPath.length / 1024); // Rough estimate
            totalOriginalSize += originalSize;
            totalOptimizedSize += optimizedSize;
          }
        }
      }
    }

    // Print summary
    const uniqueImages = [...new Set(downloadedImages.map((img) => img.filename))];
    console.log(`📁 Downloaded ${uniqueImages.length} unique images to client folders`);

    if (totalOriginalSize > 0) {
      const compressionRatio = Math.round((1 - totalOptimizedSize / totalOriginalSize) * 100);
      console.log(
        `📊 Total compression: ${compressionRatio}% (${Math.round(totalOriginalSize)}KB → ${Math.round(
          totalOptimizedSize
        )}KB)`
      );
    }

    return downloadedImages;
  }

  updateRecordWithLocalImages(records, downloadedImages) {
    return records.map((record) => {
      const updatedFields = { ...record.fields };
      const client = (record.fields?.Client || record.Client || "Unknown").trim();

      // Group downloaded images by field and record
      const imagesByField = {};

      downloadedImages.forEach((image) => {
        if (image.client === client) {
          if (!imagesByField[image.fieldName]) {
            imagesByField[image.fieldName] = [];
          }
          imagesByField[image.fieldName].push({
            url: image.localPath,
            filename: image.filename,
          });
        }
      });

      // Update record fields with local image paths
      Object.keys(imagesByField).forEach((fieldName) => {
        const images = imagesByField[fieldName];
        if (images.length === 1) {
          // Single image - use direct path
          updatedFields[fieldName] = images[0].url;
        } else {
          // Multiple images - use comma-separated paths
          updatedFields[fieldName] = images.map((img) => img.url).join(", ");
        }
      });

      return {
        ...record,
        fields: updatedFields,
      };
    });
  }
}

export default ImageDownloader;
