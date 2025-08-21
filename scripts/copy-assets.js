import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function cleanupOldVersions(clientDir) {
  try {
    const stylesDir = path.join(clientDir, "assets/styles");
    const files = await fs.readdir(stylesDir);
    const versionedFiles = files.filter(file => 
      file.startsWith('report.') && file.endsWith('.css') && file !== 'report.css'
    );
    
    // Keep only the 3 most recent versioned files per client
    if (versionedFiles.length > 3) {
      const sortedFiles = versionedFiles
        .map(file => ({ file, mtime: fs.stat(path.join(stylesDir, file)).then(stat => stat.mtime) }))
        .sort((a, b) => b.mtime - a.mtime);
      
      const filesToDelete = sortedFiles.slice(3);
      for (const { file } of filesToDelete) {
        await fs.unlink(path.join(stylesDir, file));
        console.log(`🗑️  Cleaned up old CSS version in ${path.basename(clientDir)}: ${file}`);
      }
    }
  } catch (error) {
    console.log(`⚠️  Could not cleanup old CSS versions in ${path.basename(clientDir)}: ${error.message}`);
  }
}

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

    // Copy static images to output/static folder
    const imagesSrc = path.join(srcDir, "assets/img");
    const staticImagesDest = path.join(outputDir, "static");

    try {
      await fs.access(imagesSrc);
      await copyDirectory(imagesSrc, staticImagesDest);
      console.log("✅ Static images copied to output/static folder");
    } catch (error) {
      console.log(`⚠️  Could not copy static images to static folder: ${error.message}`);
    }

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

      // Compile CSS directly to client folder
      const cssDest = path.join(clientDir, "assets/styles");
      await fs.mkdir(cssDest, { recursive: true });

      try {
        const result = sass.compile(path.join(srcDir, "assets/styles/report.scss"), {
          style: "compressed",
          loadPaths: [path.join(srcDir, "assets/styles")],
        });

        // Add versioning to CSS filename for cache busting
        const timestamp = Date.now();
        const cssFilename = `report.${timestamp}.css`;
        
        await fs.writeFile(path.join(cssDest, cssFilename), result.css, "utf8");
        
        // Also create a symlink or copy of the latest version as report.css for the template
        await fs.writeFile(path.join(cssDest, "report.css"), result.css, "utf8");
        
        console.log(`✅ CSS compiled and copied to ${clientFolder} (versioned as ${cssFilename})`);
        
        // Clean up old versioned files
        await cleanupOldVersions(clientDir);
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
