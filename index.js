import "dotenv/config";
import { createAirtableClient } from "./src/airtable.js";
import { createDataProcessor } from "./src/dataProcessor.js";
import { generateReport, generateClientReportsWrapper } from "./src/reportGenerator.js";
import { createImageDownloader } from "./src/imageDownloader.js";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as sass from "sass";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments first (before any other processing)
const args = process.argv.slice(2);
let recordId = args.find((arg) => arg.startsWith("--recordId="))?.split("=")[1];
const generateAll = args.includes("--all");

// If no --recordId flag but we have a positional argument, use it as recordId
if (!recordId && args.length > 0 && !args[0].startsWith("--")) {
  recordId = args[0];
}

// Validate command line arguments immediately
if (args.includes("--recordId=") && !recordId) {
  console.error("❌ Error: No recordId provided");
  console.error("   Usage: node index.js --recordId=recXXXXXXXXXXXXXX");
  process.exit(1);
}

// Check if we're in dev mode and set recordId from .env if needed
const isDevMode = process.env.NODE_ENV === "development" || process.env.DEV === "true";

if (isDevMode && !recordId) {
  recordId = process.env.DEV_RECORD;
  if (recordId) {
    console.log(`🎯 Dev mode: Using recordId from .env: ${recordId}`);
  } else {
    console.error("❌ Dev mode requires a recordId");
    console.error("   Usage: npm run dev -- --recordId=recXXXXXXXXXXXXXX");
    console.error("   Or set DEV_RECORD in your .env file");
    process.exit(1);
  }
}

// Check if we have either --all flag or a recordId
if (!generateAll && !recordId) {
  console.error("❌ Error: Either --all flag or recordId is required");
  console.error("   Usage: npm run build recXXXXXXXXXXXXXX");
  console.error("   Or: npm run build:all");
  process.exit(1);
}

// Validate recordId exists in Airtable if provided
const validateRecordId = async (recordId) => {
  if (!recordId) return;

  try {
    console.log("🔍 Validating recordId in Airtable...");
    const airtable = createAirtableClient();
    const record = await airtable.getRecordById(recordId);

    if (!record) {
      console.error(`❌ Error: Record with ID '${recordId}' not found in Airtable`);
      console.error("   Please check the recordId and try again");
      process.exit(1);
    }

    // Check if the record has data
    const cleanData = airtable.extractFieldData([record]);
    if (!cleanData || cleanData.length === 0 || Object.keys(cleanData[0]).length <= 1) {
      console.error(`❌ Error: Record with ID '${recordId}' has no data`);
      console.error("   Please check the record and try again");
      process.exit(1);
    }

    console.log(`✅ RecordId '${recordId}' validated successfully with data`);
  } catch (error) {
    console.error("❌ Error validating recordId:", error.message);
    console.error("   Please check your Airtable configuration and try again");
    process.exit(1);
  }
};

// Main execution function
const main = async () => {
  // Continue with normal execution
  if (isDevMode) {
    // Dev mode logic will be handled below - just return
    // The actual dev mode execution happens in the dev mode section
    return;
  } else {
    // Production mode - just generate once
    await generateAuditReports();
  }
};

// Validate recordId if we have one (either from command line or dev mode)
if (recordId) {
  console.log("🚀 Starting validation...");
  try {
    await validateRecordId(recordId);
    console.log("✅ Validation complete, proceeding with report generation...");
  } catch (error) {
    console.error("❌ Validation failed:", error.message);
    process.exit(1);
  }
}

// Get output directory from environment or default to local output folder
const getOutputDir = () => {
  if (isDevMode) {
    return path.join(__dirname, "output");
  }
  return process.env.OUTPUT_FOLDER || path.join(__dirname, "output");
};

// CSS compilation function
const compileCSS = async () => {
  try {
    console.log("🔄 Compiling SCSS to CSS...");

    // Compile SCSS to CSS
    const result = sass.compile(path.join(__dirname, "src/assets/styles/report.scss"), {
      style: "compressed", // Minify the output
      loadPaths: [path.join(__dirname, "src/assets/styles")],
    });

    // Write the compiled CSS to a temporary location
    const tempDir = path.join(__dirname, "temp");
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
};

// Asset copying function
const copyAssets = async () => {
  try {
    console.log("📁 Copying static assets...");

    const srcDir = path.join(__dirname, "src");
    const outputDir = getOutputDir();

    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    // Copy assets to each client folder
    await copyAssetsToClientFolders(outputDir, srcDir);
  } catch (error) {
    console.error("❌ Error copying assets:", error);
    throw error;
  }
};

const copyAssetsToClientFolders = async (outputDir, srcDir) => {
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
};

const copyDirectory = async (src, dest) => {
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
};

const generateSingleReport = async (recordId) => {
  try {
    console.log(`🚀 Starting single report generation for record: ${recordId}...`);

    let dataWithLocalImages;

    if (isDevMode) {
      // Dev mode: try to use cached data for single record
      const cachePath = path.join(__dirname, "output", "dev-cache.json");
      try {
        console.log("📋 Loading cached data for single record...");
        const cachedData = await fs.readFile(cachePath, "utf8");
        const recordData = JSON.parse(cachedData);

        if (recordData.id === recordId) {
          dataWithLocalImages = [recordData];
          console.log("✅ Using cached data for single record");
        } else {
          throw new Error("Cached record ID doesn't match");
        }
      } catch (error) {
        console.log("⚠️  No cached data found, fetching from Airtable...");
        dataWithLocalImages = await fetchAndProcessSingleRecord(recordId);

        // Cache just this single record for future dev runs
        await fs.mkdir(path.dirname(cachePath), { recursive: true });
        await fs.writeFile(cachePath, JSON.stringify(dataWithLocalImages[0], null, 2));
        console.log("💾 Cached single record for future dev runs");
      }
    } else {
      // Production mode: fetch fresh data
      dataWithLocalImages = await fetchAndProcessSingleRecord(recordId);
    }

    // Process the data
    console.log("⚙️  Processing audit data...");
    const processor = createDataProcessor(dataWithLocalImages);
    const summaryStats = processor.getSummaryStats();

    if (summaryStats.clients.length === 0) {
      throw new Error(`No client data found for record ${recordId}`);
    }

    // Generate report for the client
    const client = summaryStats.clients[0];
    console.log(`📄 Generating report for client: ${client}...`);

    const clientFolder = client.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const outputDir = getOutputDir();
    const clientOutputDir = path.join(outputDir, clientFolder);
    const outputPath = path.join(clientOutputDir, "index.html");

    // Store the client folder for later use in console output
    global.devClientFolder = clientFolder;

    // Copy assets to client folder before report generation
    console.log("\n📁 Copying assets to client folder...");
    await copyAssets();

    await generateReport(processor, outputPath);

    console.log(`\n✅ Report generated successfully!`);
    console.log(`📁 Report saved to: ${outputPath}`);

    return outputPath;
  } catch (error) {
    console.error("❌ Single report generation failed:", error.message);
    throw error;
  }
};

const generateAllReports = async () => {
  try {
    console.log("🚀 Starting audit report generation for all records...");
    if (isDevMode) {
      console.log("🔧 Running in DEVELOPMENT mode");
      console.log("   - Watching for file changes");
      console.log("   - Live reload enabled");
    }

    let dataWithLocalImages;

    // Always fetch fresh data (no caching for all records)
    dataWithLocalImages = await fetchAndProcessData();

    // Process the data
    console.log("⚙️  Processing audit data...");
    const processor = createDataProcessor(dataWithLocalImages);
    const summaryStats = processor.getSummaryStats();

    console.log(`\n📋 Found audits for ${summaryStats.clients.length} client(s):`);
    summaryStats.clients.forEach((client) => console.log(`   • ${client}`));

    if (summaryStats.clients.length === 1) {
      // Single client - generate one report in client-specific folder
      console.log("\n📄 Generating single client report...");
      const client = summaryStats.clients[0];
      const clientFolder = client.toLowerCase().replace(/[^a-z0-9]/g, "-");
      const outputDir = getOutputDir();
      const clientOutputDir = path.join(outputDir, clientFolder);
      const outputPath = path.join(clientOutputDir, "index.html");

      await generateReport(processor, outputPath);

      console.log(`\n✅ Report generated successfully!`);
      console.log(`📁 Report saved to: ${outputPath}`);
    } else {
      // Multiple clients - generate individual reports in client-specific folders
      console.log("\n📄 Generating individual client reports...");

      for (const client of summaryStats.clients) {
        console.log(`   🔄 Processing ${client}...`);

        // Filter data for this client
        const clientData = dataWithLocalImages.filter((record) => {
          const recordClient = record.fields?.Client || record.Client;
          return recordClient === client;
        });
        const clientProcessor = createDataProcessor(clientData);
        // Use the generateReport function directly

        // Generate client folder and index.html
        const clientFolder = client.toLowerCase().replace(/[^a-z0-9]/g, "-");
        const outputDir = getOutputDir();
        const clientOutputDir = path.join(outputDir, clientFolder);
        const outputPath = path.join(clientOutputDir, "index.html");

        await generateReport(clientProcessor, outputPath);
        console.log(`   ✅ ${client} report saved to: ${outputPath}`);
      }

      console.log(`\n🎉 All ${summaryStats.clients.length} client reports generated successfully!`);
    }

    // Copy assets to client folders before report generation
    console.log("\n📁 Copying assets to client folders...");
    await copyAssets();

    if (!isDevMode) {
      console.log(`\n🌐 Open the HTML files in your browser to view the reports`);
      console.log(`📁 Each client folder contains all necessary assets`);
    }
  } catch (error) {
    console.error("❌ Report generation failed:", error.message);
    throw error;
  }
};

const generateAuditReports = async () => {
  try {
    if (recordId) {
      await generateSingleReport(recordId);
    } else if (generateAll || !isDevMode) {
      await generateAllReports();
    } else {
      // This should never happen now since dev mode requires recordId
      console.error("❌ Dev mode requires a recordId");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Report generation failed:", error.message);
    process.exit(1);
  }
};

const fetchAndProcessSingleRecord = async (recordId) => {
  // Fetch single record from Airtable
  console.log("📊 Fetching record from Airtable...");
  const airtable = createAirtableClient();
  const record = await airtable.getRecordById(recordId);

  if (!record) {
    throw new Error(`Record with ID ${recordId} not found in Airtable`);
  }

  const cleanData = airtable.extractFieldData([record]);

  // Download images for this record
  console.log("🖼️  Downloading images...");
  const outputDir = getOutputDir();
  const imageDownloader = createImageDownloader(outputDir);
  const downloadedImages = await imageDownloader.downloadAllImages(cleanData);

  // Update data with local image paths
  return imageDownloader.updateRecordWithLocalImages(cleanData, downloadedImages);
};

const fetchAndProcessData = async () => {
  // Fetch data from Airtable
  console.log("📊 Fetching data from Airtable...");
  const airtable = createAirtableClient();
  const records = await airtable.getAllRecords();
  const cleanData = airtable.extractFieldData(records);

  // Download images for each client
  console.log("🖼️  Downloading images...");
  const outputDir = getOutputDir();
  const imageDownloader = createImageDownloader(outputDir);

  const downloadedImages = await imageDownloader.downloadAllImages(cleanData);

  // Update data with local image paths
  return imageDownloader.updateRecordWithLocalImages(cleanData, downloadedImages);
};

// Dev mode with file watching
if (isDevMode) {
  console.log("👀 Starting development server with file watching...");

  // Log dev mode configuration
  console.log(`🎯 Dev mode: Single record generation for recordId: ${recordId}`);

  // Import chokidar for file watching (we'll need to install it)
  let chokidar;
  try {
    chokidar = (await import("chokidar")).default;
  } catch (error) {
    console.error("❌ chokidar not installed. Please run: npm install chokidar");
    console.log("💡 For now, running without file watching...");
    await generateAuditReports();
    process.exit(0);
  }

  // Start HTTP server to serve files
  const http = await import("http");
  const fs = await import("fs");
  const path = await import("path");
  const url = await import("url");

  const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    let filePath = parsedUrl.pathname;

    // Default to the first client folder if no file specified
    if (filePath === "/") {
      // Find the first client folder
      const outputDir = getOutputDir();
      try {
        const items = fs.readdirSync(outputDir);
        const clientFolders = items.filter((item) => {
          const itemPath = path.join(outputDir, item);
          return fs.statSync(itemPath).isDirectory();
        });

        if (clientFolders.length > 0) {
          filePath = `/${clientFolders[0]}/`;
        } else {
          filePath = "/index.html";
        }
      } catch (error) {
        console.error("Error reading output directory:", error);
        filePath = "/index.html";
      }
    }

    // Handle client folder structure
    let fullPath;
    try {
      if (filePath.startsWith("/") && filePath.split("/").length === 2) {
        // This is a client folder request, serve index.html
        const clientFolder = filePath.split("/")[1];
        fullPath = path.join(getOutputDir(), clientFolder, "index.html");
      } else if (filePath.endsWith("/")) {
        // Directory request, serve index.html from that directory
        const dirPath = filePath.substring(1, filePath.length - 1); // Remove leading / and trailing /
        fullPath = path.join(getOutputDir(), dirPath, "index.html");
      } else {
        // Remove leading slash and resolve to output directory
        fullPath = path.join(getOutputDir(), filePath.substring(1));
      }
    } catch (error) {
      console.error("Error resolving file path:", error);
      res.writeHead(500, { "Content-Type": "text/html" });
      res.end(`<h1>500 - Internal Server Error</h1><p>${error.message}</p>`);
      return;
    }

    // Check if file exists
    fs.access(fullPath, fs.constants.F_OK, (err) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/html" });
        let availableReports = "";
        try {
          availableReports = fs
            .readdirSync(getOutputDir())
            .filter((item) => {
              const itemPath = path.join(getOutputDir(), item);
              return fs.statSync(itemPath).isDirectory();
            })
            .map((folder) => `<li><a href="/${folder}/">${folder}</a></li>`)
            .join("");
        } catch (error) {
          availableReports = "<li>No reports available</li>";
        }

        res.end(`
          <html>
            <head><title>404 - File Not Found</title></head>
            <body>
              <h1>404 - File Not Found</h1>
              <p>Requested file: ${filePath}</p>
              <p>Available client reports:</p>
              <ul>
                ${availableReports}
              </ul>
            </body>
          </html>
        `);
        return;
      }

      // Get file extension for content type
      const ext = path.extname(fullPath).toLowerCase();
      const contentTypes = {
        ".html": "text/html",
        ".css": "text/css",
        ".js": "application/javascript",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".svg": "image/svg+xml",
      };

      const contentType = contentTypes[ext] || "application/octet-stream";

      // Read and serve file
      fs.readFile(fullPath, (err, data) => {
        if (err) {
          res.writeHead(500, { "Content-Type": "text/html" });
          res.end(`<h1>500 - Internal Server Error</h1><p>${err.message}</p>`);
          return;
        }

        // Inject live reload script for HTML files
        if (contentType === "text/html") {
          const liveReloadScript = `
            <script>
              (function() {
                const ws = new WebSocket('ws://localhost:3001');
                ws.onmessage = function(event) {
                  if (event.data === 'reload') {
                    console.log('🔄 Live reload triggered');
                    window.location.reload();
                  }
                };
                ws.onerror = function() {
                  console.log('⚠️ Live reload WebSocket not available');
                };
              })();
            </script>
          `;

          // Insert the script before closing body tag
          const htmlContent = data.toString();
          const modifiedContent = htmlContent.replace("</body>", liveReloadScript + "</body>");

          res.writeHead(200, { "Content-Type": contentType });
          res.end(modifiedContent);
        } else {
          res.writeHead(200, { "Content-Type": contentType });
          res.end(data);
        }
      });
    });
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`🌐 Development server running at http://localhost:${PORT}`);
    console.log(`📁 Serving files from: ${getOutputDir()}`);
  });

  // WebSocket server for live reload
  const { WebSocketServer } = await import("ws");
  const wss = new WebSocketServer({ port: 3001 });

  console.log("🔌 Live reload WebSocket server running on ws://localhost:3001");

  // Function to notify all connected clients to reload
  function notifyReload() {
    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        // WebSocket.OPEN
        client.send("reload");
      }
    });
  }

  // Watch for changes in template and SCSS files
  const watchPaths = [
    "src/templates/**/*",
    "src/assets/styles/**/*",
    "src/assets/styles/_*.scss", // Explicitly include partial files
    "src/templates/*.html", // Explicitly include HTML files
    "src/components/**/*", // Watch component files
    "src/generators/**/*", // Watch generator files
  ];

  const watcher = chokidar.watch(watchPaths, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: false, // Don't ignore initial events
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 100,
    },
  });

  console.log("👀 Watching for changes in:");
  watchPaths.forEach((path) => console.log(`   📁 ${path}`));
  console.log("🔄 Press Ctrl+C to stop the dev server");

  // Log all watched files on startup
  watcher.on("ready", () => {
    console.log("\n📋 Currently watching these files:");
    const watchedFiles = [];
    const watched = watcher.getWatched();
    Object.keys(watched).forEach((dir) => {
      watched[dir].forEach((file) => {
        const fullPath = path.join(dir, file);
        watchedFiles.push(fullPath);
        console.log(`   👁️  ${fullPath}`);
      });
    });
    console.log(`\n📊 Total files being watched: ${watchedFiles.length}`);
  });

  // Initial generation
  await generateAuditReports();

  // Dev mode setup complete
  console.log("\n🎉 Development server is ready!");

  // Show the specific report URL for the record being developed
  console.log("📁 Open files:");
  if (global.devClientFolder) {
    console.log(`   🌐 http://localhost:3000/${global.devClientFolder}/index.html`);
  } else {
    console.log("   🌐 http://localhost:3000/");
  }

  console.log("\n🔄 Live reload is active - changes to templates and styles will automatically regenerate reports");
  console.log("⏹️  Press Ctrl+C to stop the dev server");

  // Watch for changes
  watcher.on("change", async (filepath) => {
    console.log(`\n🔄 File changed: ${filepath}`);

    try {
      // If it's a SCSS file, recompile CSS first
      if (filepath.includes(".scss")) {
        console.log("🎨 Recompiling CSS...");
        await compileCSS();
        console.log("✅ CSS recompiled successfully!");
      }

      // Copy assets first to ensure fonts are available
      await copyAssets();

      console.log("🔄 Regenerating report...");
      await generateAuditReports();
      console.log("✅ Report regenerated successfully!");
      notifyReload(); // Notify clients about regeneration
    } catch (error) {
      console.error("❌ Error regenerating report:", error);
    }
  });

  // Additional event handlers for debugging
  watcher.on("add", (filepath) => {
    console.log(`➕ File added: ${filepath}`);
  });

  watcher.on("unlink", (filepath) => {
    console.log(`➖ File removed: ${filepath}`);
  });

  watcher.on("error", (error) => {
    console.error("❌ Watcher error:", error);
  });

  // Handle graceful shutdown
  process.on("SIGINT", () => {
    console.log("\n👋 Shutting down dev server...");
    watcher.close();
    server.close();
    process.exit(0);
  });
} else {
  // Production mode - just generate once
  generateAuditReports();
}
