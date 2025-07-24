import "dotenv/config";
import AirtableClient from "./src/airtable.js";
import DataProcessor from "./src/dataProcessor.js";
import ReportGenerator from "./src/reportGenerator.js";
import ImageDownloader from "./src/imageDownloader.js";
import copyAssets from "./scripts/copy-assets.js";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if we're in dev mode
const isDevMode = process.env.NODE_ENV === "development" || process.env.DEV === "true";

async function generateAuditReports() {
  try {
    console.log("🚀 Starting audit report generation...");
    if (isDevMode) {
      console.log("🔧 Running in DEVELOPMENT mode");
      console.log("   - Using cached data (no Airtable fetch)");
      console.log("   - Watching for file changes");
      console.log("   - Live reload enabled");
    }

    let dataWithLocalImages;

    if (isDevMode) {
      // Dev mode: try to use cached data
      const cachePath = path.join(__dirname, "output", "dev-cache.json");
      try {
        console.log("📋 Loading cached data...");
        const cachedData = await fs.readFile(cachePath, "utf8");
        dataWithLocalImages = JSON.parse(cachedData);
        console.log("✅ Using cached data");
      } catch (error) {
        console.log("⚠️  No cached data found, fetching from Airtable...");
        dataWithLocalImages = await fetchAndProcessData();
        // Cache the data for future dev runs
        await fs.mkdir(path.dirname(cachePath), { recursive: true });
        await fs.writeFile(cachePath, JSON.stringify(dataWithLocalImages, null, 2));
        console.log("💾 Data cached for future dev runs");
      }
    } else {
      // Production mode: always fetch fresh data
      dataWithLocalImages = await fetchAndProcessData();
    }

    // Process the data
    console.log("⚙️  Processing audit data...");
    const processor = new DataProcessor(dataWithLocalImages);
    const summaryStats = processor.getSummaryStats();

    console.log(`\n📋 Found audits for ${summaryStats.clients.length} client(s):`);
    summaryStats.clients.forEach((client) => console.log(`   • ${client}`));

    if (summaryStats.clients.length === 1) {
      // Single client - generate one report in client-specific folder
      console.log("\n📄 Generating single client report...");
      const client = summaryStats.clients[0];
      const clientFolder = client.toLowerCase().replace(/[^a-z0-9]/g, "-");
      const outputDir = path.join(__dirname, "output", clientFolder);
      const outputPath = path.join(outputDir, "index.html");

      const reportGenerator = new ReportGenerator(processor);
      const reportPath = await reportGenerator.generateReport(outputPath);

      console.log(`\n✅ Report generated successfully!`);
      console.log(`📁 Report saved to: ${outputPath}`);

      if (isDevMode) {
        console.log(`🌐 Open http://localhost:3000/${clientFolder}/index.html to view the report`);
      }
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
        const clientProcessor = new DataProcessor(clientData);
        const clientReportGenerator = new ReportGenerator(clientProcessor);

        // Generate client folder and index.html
        const clientFolder = client.toLowerCase().replace(/[^a-z0-9]/g, "-");
        const outputDir = path.join(__dirname, "output", clientFolder);
        const outputPath = path.join(outputDir, "index.html");

        await clientReportGenerator.generateReport(outputPath);
        console.log(`   ✅ ${client} report saved to: ${outputPath}`);
      }

      console.log(`\n🎉 All ${summaryStats.clients.length} client reports generated successfully!`);
    }

    if (!isDevMode) {
      console.log(`\n🌐 Open the HTML files in your browser to view the reports`);
      console.log(`📁 Each client folder contains all necessary assets`);
    }

    // Copy assets to client folders after report generation
    console.log("\n📁 Copying assets to client folders...");
    await copyAssets();
  } catch (error) {
    console.error("❌ Report generation failed:", error.message);
  }
}

async function fetchAndProcessData() {
  // Fetch data from Airtable
  console.log("📊 Fetching data from Airtable...");
  const airtable = new AirtableClient();
  const records = await airtable.getAllRecords();
  const cleanData = airtable.extractFieldData(records);

  // Download images for each client
  console.log("🖼️  Downloading images...");
  const outputDir = path.join(__dirname, "output");
  const imageDownloader = new ImageDownloader(outputDir);

  const downloadedImages = await imageDownloader.downloadAllImages(cleanData);

  // Update data with local image paths
  return imageDownloader.updateRecordWithLocalImages(cleanData, downloadedImages);
}

// Dev mode with file watching
if (isDevMode) {
  console.log("👀 Starting development server with file watching...");

  // Import chokidar for file watching (we'll need to install it)
  let chokidar;
  try {
    chokidar = (await import("chokidar")).default;
  } catch (error) {
    console.error("❌ chokidar not installed. Please run: npm install chokidar");
    console.log("💡 For now, running without file watching...");
    generateAuditReports();
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
      const outputDir = path.join(__dirname, "output");
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
        fullPath = path.join(__dirname, "output", clientFolder, "index.html");
      } else if (filePath.endsWith("/")) {
        // Directory request, serve index.html from that directory
        const dirPath = filePath.substring(1, filePath.length - 1); // Remove leading / and trailing /
        fullPath = path.join(__dirname, "output", dirPath, "index.html");
      } else {
        // Remove leading slash and resolve to output directory
        fullPath = path.join(__dirname, "output", filePath.substring(1));
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
            .readdirSync(path.join(__dirname, "output"))
            .filter((item) => {
              const itemPath = path.join(__dirname, "output", item);
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
    console.log(`📁 Serving files from: ${path.join(__dirname, "output")}`);
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

  // Watch for changes
  watcher.on("change", async (filepath) => {
    console.log(`\n🔄 File changed: ${filepath}`);

    try {
      // If it's a SCSS file, recompile CSS first
      if (filepath.includes(".scss")) {
        console.log("🎨 Recompiling CSS...");
        const { default: compileCSS } = await import("./scripts/compile-css.js");
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
