import * as sass from "sass";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    const tempPath = path.join(tempDir, "report.css");
    await fs.writeFile(tempPath, result.css, "utf8");

    console.log(`✅ CSS compiled successfully: ${tempPath}`);
    console.log(`📊 CSS size: ${(result.css.length / 1024).toFixed(2)} KB`);

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
