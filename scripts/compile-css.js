import * as sass from "sass";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function cleanupOldVersions(tempDir) {
  try {
    const files = await fs.readdir(tempDir);
    const versionedFiles = files.filter(
      (file) => file.startsWith("report.") && file.endsWith(".css") && file !== "report.css"
    );

    // Keep only the 5 most recent versioned files
    if (versionedFiles.length > 5) {
      const sortedFiles = versionedFiles
        .map((file) => ({ file, mtime: fs.stat(path.join(tempDir, file)).then((stat) => stat.mtime) }))
        .sort((a, b) => b.mtime - a.mtime);

      const filesToDelete = sortedFiles.slice(5);
      for (const { file } of filesToDelete) {
        await fs.unlink(path.join(tempDir, file));
        console.log(`🗑️  Cleaned up old CSS version: ${file}`);
      }
    }
  } catch (error) {
    console.log(`⚠️  Could not cleanup old CSS versions: ${error.message}`);
  }
}

async function compileCSS() {
  try {
    console.log("🔄 Compiling SCSS to CSS...");

    // Compile SCSS to CSS
    const result = sass.compile(path.join(__dirname, "../src/assets/styles/report.scss"), {
      style: "compressed", // Minify the output
      loadPaths: [path.join(__dirname, "../src/assets/styles")],
    });

    // Write the compiled CSS to a temporary location
    const tempDir = path.join(__dirname, "../temp");
    await fs.mkdir(tempDir, { recursive: true });

    // Create versioned CSS file for cache busting
    const timestamp = Date.now();
    const versionedPath = path.join(tempDir, `report.${timestamp}.css`);
    await fs.writeFile(versionedPath, result.css, "utf8");

    // Also create unversioned file for the template
    const tempPath = path.join(tempDir, "report.css");
    await fs.writeFile(tempPath, result.css, "utf8");

    console.log(`✅ CSS compiled successfully: ${tempPath}`);
    console.log(`📊 CSS size: ${(result.css.length / 1024).toFixed(2)} KB`);
    console.log(`🔄 Versioned CSS also created: ${path.basename(versionedPath)}`);

    // Clean up old versioned files
    await cleanupOldVersions(tempDir);

    return result.css;
  } catch (error) {
    console.error("❌ Error compiling CSS:", error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  compileCSS().catch(process.exit);
}

export default compileCSS;
