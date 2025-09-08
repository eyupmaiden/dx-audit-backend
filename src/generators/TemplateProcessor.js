import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load a template section from the sections directory
export const loadTemplateSection = async (sectionName) => {
  const sectionPath = path.join(__dirname, "..", "templates", "sections", `${sectionName}.html`);
  try {
    return await fs.readFile(sectionPath, "utf8");
  } catch (error) {
    console.error(`Error loading template section ${sectionName}:`, error);
    return `<!-- Error loading ${sectionName} template -->`;
  }
};

// Load all template sections and combine them
export const loadModularTemplate = async () => {
  const baseTemplatePath = path.join(__dirname, "..", "templates", "base.html");
  const baseTemplate = await fs.readFile(baseTemplatePath, "utf8");

  // Load all section templates
  const sections = ["header", "intro", "summary", "journey", "eyequant", "charts", "findings", "cta", "footer"];

  const sectionTemplates = {};
  for (const section of sections) {
    sectionTemplates[section] = await loadTemplateSection(section);
  }

  return { baseTemplate, sectionTemplates };
};

export const replacePlaceholders = (template, reportDetails, summaryStats) => {
  const { clients, overallAverage, highestCategory, lowestCategory, totalAudits } = summaryStats;
  const { user, userId, site, reportDate } = reportDetails;
  const clientName = clients.join(", ");

  // Generate asset version for cache busting
  const assetVersion = Date.now().toString();

  const replacements = {
    "{{USER}}": user,
    "{{USER_ID}}": userId,
    "{{SITE}}": site,
    "{{CLIENT_NAME}}": clientName,
    "{{REPORT_DATE}}": reportDate,
    "{{OVERALL_AVERAGE}}": overallAverage,
    "{{HIGHEST_CATEGORY_NAME}}": highestCategory[0],
    "{{HIGHEST_CATEGORY_SCORE}}": highestCategory[1],
    "{{LOWEST_CATEGORY_NAME}}": lowestCategory[0],
    "{{LOWEST_CATEGORY_SCORE}}": lowestCategory[1],
    "{{TOTAL_AUDITS}}": totalAudits,
    "{{ASSET_VERSION}}": assetVersion,
  };

  let html = template;
  Object.entries(replacements).forEach(([placeholder, value]) => {
    html = html.replace(new RegExp(placeholder, "g"), value);
  });

  return html;
};

// New function to build the complete template from modular sections
export const buildModularTemplate = async (reportDetails, summaryStats, componentContent) => {
  const { baseTemplate, sectionTemplates } = await loadModularTemplate();

  // Replace basic placeholders in all sections
  const processedSections = {};
  for (const [sectionName, sectionTemplate] of Object.entries(sectionTemplates)) {
    processedSections[sectionName] = replacePlaceholders(sectionTemplate, reportDetails, summaryStats);
  }

  // Start with the base template and process its placeholders first
  let finalTemplate = replacePlaceholders(baseTemplate, reportDetails, summaryStats);

  // Replace section placeholders with processed section templates
  finalTemplate = finalTemplate.replace("{{HEADER_SECTION}}", processedSections.header);
  finalTemplate = finalTemplate.replace("{{INTRO_SECTION}}", processedSections.intro);
  finalTemplate = finalTemplate.replace("{{SUMMARY_SECTION}}", processedSections.summary);
  finalTemplate = finalTemplate.replace("{{JOURNEY_SECTION}}", processedSections.journey);
  finalTemplate = finalTemplate.replace("{{EYEQUANT_SECTION}}", processedSections.eyequant);
  finalTemplate = finalTemplate.replace("{{CHARTS_SECTION}}", processedSections.charts);
  finalTemplate = finalTemplate.replace("{{FINDINGS_SECTION}}", processedSections.findings);
  finalTemplate = finalTemplate.replace("{{CTA_SECTION}}", processedSections.cta);
  finalTemplate = finalTemplate.replace("{{FOOTER_SECTION}}", processedSections.footer);

  // Replace component content placeholders
  finalTemplate = finalTemplate.replace("{{USER_JOURNEY_CONTENT}}", componentContent.userJourney || "");
  finalTemplate = finalTemplate.replace("{{EYEQUANT_CONTENT}}", componentContent.eyequant || "");
  finalTemplate = finalTemplate.replace("{{DETAILED_FINDINGS}}", componentContent.findings || "");
  finalTemplate = finalTemplate.replace("{{CHART_SCRIPTS}}", componentContent.chartScripts || "");

  return finalTemplate;
};
