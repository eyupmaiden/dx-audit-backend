import { generateHtmlReport, generateClientReports } from "./generators/HtmlGenerator.js";

export const generateReport = async (dataProcessor, outputPath = "./output/audit-report.html") => {
  console.log("generateReport method called with outputPath:", outputPath);
  return generateHtmlReport(dataProcessor, outputPath);
};

// Helper function to generate multiple reports if you have multiple clients
export const generateClientReportsWrapper = async (dataProcessor, outputDir = "./output") => {
  return generateClientReports(dataProcessor, outputDir);
};
