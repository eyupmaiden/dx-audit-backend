// Image optimization configurations for different types of images
const imageConfigs = {
  screenshots: {
    maxWidth: 720,
    maxHeight: 1280,
    fit: "inside",
    format: "jpeg",
    quality: 85,
    background: { r: 255, g: 255, b: 255, alpha: 1 },
  },
  eyequant: {
    maxWidth: 640,
    maxHeight: 1383,
    fit: "inside",
    format: "jpeg",
    quality: 90,
    background: { r: 255, g: 255, b: 255, alpha: 1 },
  },
  default: {
    maxWidth: 800,
    maxHeight: 600,
    fit: "inside",
    format: "jpeg",
    quality: 80,
    background: { r: 255, g: 255, b: 255, alpha: 1 },
  },
};

// Get image configuration by type
export function getImageConfig(type) {
  return imageConfigs[type] || imageConfigs.default;
}

// Determine image type from Airtable field name
export function getImageTypeFromField(fieldName) {
  const fieldNameLower = fieldName.toLowerCase();

  if (fieldNameLower.includes("eyequant")) {
    return "eyequant";
  }

  if (fieldNameLower.includes("screenshot") || fieldNameLower.includes("phase")) {
    return "screenshots";
  }

  return "default";
}

// Get all available image types
export function getAvailableImageTypes() {
  return Object.keys(imageConfigs);
}

// Validate image configuration
export function validateImageConfig(config) {
  const requiredFields = ["maxWidth", "maxHeight", "fit", "format", "quality"];

  for (const field of requiredFields) {
    if (!(field in config)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  if (config.quality < 1 || config.quality > 100) {
    throw new Error("Quality must be between 1 and 100");
  }

  if (config.maxWidth < 1 || config.maxHeight < 1) {
    throw new Error("Dimensions must be positive numbers");
  }

  return true;
}
