import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function copyAssets() {
  try {
    console.log("📁 Copying static assets...");

    const srcDir = path.join(__dirname, "../src");
    const outputDir = path.join(__dirname, "../output");

    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    // Copy assets to each client folder
    await copyAssetsToClientFolders(outputDir, srcDir);
  } catch (error) {
    console.error("❌ Error copying assets:", error);
    throw error;
  }
}

async function copyAssetsToClientFolders(outputDir, srcDir) {
  try {
    // Get all client folders
    const items = await fs.readdir(outputDir);
    const clientFolders = [];

    for (const item of items) {
      const itemPath = path.join(outputDir, item);
      const stat = await fs.stat(itemPath);
      if (stat.isDirectory() && item !== "assets") {
        clientFolders.push(item);
      }
    }

    if (clientFolders.length === 0) {
      console.log("ℹ️  No client folders found, skipping client-specific asset copying");
      return;
    }

    console.log(`📁 Copying assets to ${clientFolders.length} client folder(s)...`);

    // Import sass for CSS compilation
    const sass = await import("sass");

    for (const clientFolder of clientFolders) {
      const clientDir = path.join(outputDir, clientFolder);

      // Copy fonts to client folder
      const fontsSrc = path.join(srcDir, "assets/fonts");
      const fontsDest = path.join(clientDir, "assets/fonts");

      try {
        await fs.access(fontsSrc);
        await copyDirectory(fontsSrc, fontsDest);
      } catch (error) {
        console.log(`⚠️  Could not copy fonts to ${clientFolder}`);
      }

      // Copy static images to client folder
      const imagesSrc = path.join(srcDir, "assets/img");
      const imagesDest = path.join(clientDir, "assets/img");

      try {
        await fs.access(imagesSrc);
        await copyDirectory(imagesSrc, imagesDest);
      } catch (error) {
        console.log(`⚠️  Could not copy static images to ${clientFolder}`);
      }

      // Compile CSS directly to client folder
      const cssDest = path.join(clientDir, "assets/styles");
      await fs.mkdir(cssDest, { recursive: true });

      try {
        const result = sass.compile(path.join(srcDir, "assets/styles/report.scss"), {
          style: "compressed",
          loadPaths: [path.join(srcDir, "assets/styles")],
        });

        await fs.writeFile(path.join(cssDest, "report.css"), result.css, "utf8");
        console.log(`✅ CSS compiled and copied to ${clientFolder}`);
      } catch (error) {
        console.log(`⚠️  Could not compile CSS for ${clientFolder}: ${error.message}`);
      }
    }

    console.log("✅ Assets copied to all client folders successfully");
  } catch (error) {
    console.error("❌ Error copying assets to client folders:", error);
  }
}

async function copyDirectory(src, dest) {
  // Create destination directory
  await fs.mkdir(dest, { recursive: true });

  // Read source directory
  const items = await fs.readdir(src);

  for (const item of items) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);

    const stat = await fs.stat(srcPath);

    if (stat.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  copyAssets().catch(process.exit);
}

export default copyAssets;
