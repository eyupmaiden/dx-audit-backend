import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { generateHeaderHtml } from "../components/HeaderComponent.js";
import { generateSummaryHtml } from "../components/SummaryComponent.js";
import { generateJourneyHtml } from "../components/JourneyComponent.js";
import { generateEyequantHtml } from "../components/EyequantComponent.js";
import { generateFindingsHtml } from "../components/FindingsComponent.js";
import { generateCtaHtml } from "../components/CtaComponent.js";
import { generateChartScripts } from "./ChartGenerator.js";
import { replacePlaceholders } from "./TemplateProcessor.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateHtmlReport = async (dataProcessor, outputPath = "./output/audit-report.html") => {
  console.log("generateReport method called with outputPath:", outputPath);
  try {
    // Read the HTML template
    const templatePath = path.join(__dirname, "..", "templates", "report.html");
    let htmlTemplate = await fs.readFile(templatePath, "utf8");

    // Get processed data
    const reportDetails = dataProcessor.getReportDetails();
    const summaryStats = dataProcessor.getSummaryStats();

    // Replace basic template placeholders
    htmlTemplate = replacePlaceholders(htmlTemplate, reportDetails, summaryStats);

    // Generate component content and replace placeholders
    htmlTemplate = htmlTemplate.replace("{{USER_JOURNEY_CONTENT}}", generateJourneyHtml(dataProcessor));
    htmlTemplate = htmlTemplate.replace("{{EYEQUANT_CONTENT}}", generateEyequantHtml(dataProcessor));
    htmlTemplate = htmlTemplate.replace("{{DETAILED_FINDINGS}}", generateFindingsHtml(dataProcessor));

    // Generate chart scripts
    const chartScripts = generateChartScripts(dataProcessor);
    htmlTemplate = htmlTemplate.replace("{{CHART_SCRIPTS}}", chartScripts);

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    await fs.mkdir(outputDir, { recursive: true });

    // Write the final HTML file
    await fs.writeFile(outputPath, htmlTemplate, "utf8");

    console.log(`✅ Report generated successfully: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error("Error generating report:", error);
    throw error;
  }
};

// Helper function to generate multiple reports if you have multiple clients
export const generateClientReports = async (dataProcessor, outputDir = "./output") => {
  const detailedFindings = dataProcessor.getDetailedFindings();
  const clients = [...new Set(detailedFindings.map((audit) => audit.client || audit.Client))];

  const reports = [];

  for (const client of clients) {
    // Create a filtered data processor for this client
    const clientData = detailedFindings.filter((audit) => (audit.client || audit.Client) === client);
    const { createDataProcessor } = await import("../dataProcessor.js");
    const clientProcessor = createDataProcessor(clientData);

    const filename = `${client.toLowerCase().replace(/\s+/g, "-")}.html`;
    const outputPath = path.join(outputDir, filename);

    await generateHtmlReport(clientProcessor, outputPath);
    reports.push(outputPath);
  }

  return reports;
};
