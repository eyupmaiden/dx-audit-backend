import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ReportGenerator {
  constructor(dataProcessor) {
    this.dataProcessor = dataProcessor;
    console.log("ReportGenerator constructed with dataProcessor:", !!dataProcessor);
  }

  async generateReport(outputPath = "./output/audit-report.html") {
    console.log("generateReport method called with outputPath:", outputPath);
    try {
      // Read the HTML template
      const templatePath = path.join(__dirname, "templates", "report.html");
      let htmlTemplate = await fs.readFile(templatePath, "utf8");

      // CSS is now always external via link tag in template

      // Get processed data
      const summaryStats = this.dataProcessor.getSummaryStats();
      const detailedFindings = this.dataProcessor.getDetailedFindings();
      const radarData = this.dataProcessor.getRadarChartData();
      const barData = this.dataProcessor.getBarChartData();
      const journeyData = this.dataProcessor.getUserJourneyData();
      const eyequantData = this.dataProcessor.getEyequantData();

      // Replace template placeholders
      htmlTemplate = this.replacePlaceholders(htmlTemplate, summaryStats, detailedFindings, journeyData, eyequantData);

      // Generate chart scripts
      const chartScripts = this.generateChartScripts(radarData, barData);
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
  }

  replacePlaceholders(template, summaryStats, detailedFindings, journeyData, eyequantData) {
    const { clients, overallAverage, highestCategory, lowestCategory, totalAudits } = summaryStats;
    const clientName = clients.join(", ");
    const reportDate = new Date().toLocaleDateString("en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const replacements = {
      "{{CLIENT_NAME}}": clientName,
      "{{REPORT_DATE}}": reportDate,
      "{{OVERALL_AVERAGE}}": overallAverage,
      "{{HIGHEST_CATEGORY_NAME}}": highestCategory[0],
      "{{HIGHEST_CATEGORY_SCORE}}": highestCategory[1],
      "{{LOWEST_CATEGORY_NAME}}": lowestCategory[0],
      "{{LOWEST_CATEGORY_SCORE}}": lowestCategory[1],
      "{{TOTAL_AUDITS}}": totalAudits,
    };

    let html = template;
    Object.entries(replacements).forEach(([placeholder, value]) => {
      html = html.replace(new RegExp(placeholder, "g"), value);
    });

    // Generate detailed findings HTML
    const findingsHtml = this.generateDetailedFindingsHtml(detailedFindings);
    html = html.replace("{{DETAILED_FINDINGS}}", findingsHtml);

    // Generate user journey HTML
    const journeyHtml = this.generateUserJourneyHtml(journeyData);
    html = html.replace("{{USER_JOURNEY_CONTENT}}", journeyHtml);

    // Generate Eyequant HTML
    const eyequantHtml = this.generateEyequantHtml(eyequantData);
    html = html.replace("{{EYEQUANT_CONTENT}}", eyequantHtml);

    return html;
  }

  generateDetailedFindingsHtml(detailedFindings) {
    return detailedFindings
      .map((audit) => {
        // Split findings into two categories and sort them
        const needsWork = audit.findings.filter((finding) => finding.score <= 3).sort((a, b) => a.score - b.score); // Lowest to highest

        const doingWell = audit.findings.filter((finding) => finding.score > 3).sort((a, b) => b.score - a.score); // Highest to lowest

        return `
        <div class="client-findings">
          ${this.generateFindingsSection(needsWork, "needs-work", "What needs work")}
          ${this.generateFindingsSection(doingWell, "doing-well", "What you're doing well")}
        </div>
      `;
      })
      .join("");
  }

  generateFindingsSection(findings, className, title) {
    if (findings.length === 0) return "";

    const findingsHtml = findings
      .map((finding) => {
        const scoreClass = `score-${finding.score}`;
        return `
        <div class="category-findings ${className}-item">
          <div class="category-header">
            <div class="category-name">
              <span class="score-indicator ${scoreClass}"></span>
              ${finding.category}
            </div>
            <div class="category-score">${finding.score}/5</div>
          </div>
          <div class="finding-item">
            <div class="finding-label">${className === "needs-work" ? "Issue Identified:" : "What's working:"}</div>
            <div class="finding-text">${finding.issue}</div>
          </div>
          <div class="finding-item">
            <div class="finding-label">${
              className === "needs-work" ? "Recommended Experiment:" : "Potential Enhancement:"
            }</div>
            <div class="finding-text">${finding.experiment}</div>
          </div>
        </div>
      `;
      })
      .join("");

    return `
      <div class="findings-subsection">
        <h4 class="subsection-title ${className}">${title}</h4>
        ${findingsHtml}
      </div>
    `;
  }

  generateChartScripts(radarData, barData) {
    const radarOptions = this.dataProcessor.getChartOptions("radar");

    return `
    <script>
      function initCharts() {
        console.log('Initializing charts...');
        console.log('Chart.js available:', typeof Chart !== 'undefined');
        
        if (typeof Chart === 'undefined') {
          console.error('Chart.js not loaded');
          return;
        }

        try {
          // Radar Chart
          const radarCanvas = document.getElementById('radarChart');
          if (radarCanvas) {
            const radarCtx = radarCanvas.getContext('2d');
            new Chart(radarCtx, {
              type: 'radar',
              data: ${JSON.stringify(radarData)},
              options: ${JSON.stringify(radarOptions)}
            });
            console.log('Radar chart created');
            
            // Center the chart container on mobile
            setTimeout(() => {
              const chartContainer = document.querySelector('.chart-container');
              if (chartContainer && window.innerWidth <= 768) {
                const scrollWidth = chartContainer.scrollWidth;
                const clientWidth = chartContainer.clientWidth;
                const scrollLeft = (scrollWidth - clientWidth) / 2;
                chartContainer.scrollLeft = scrollLeft;
              }
            }, 100);
          }
        } catch (error) {
          console.error('Chart creation error:', error);
        }
      }

      // Wait for everything to load
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCharts);
      } else {
        initCharts();
      }
    </script>
    `;
  }

  generateUserJourneyHtml(journeyData) {
    return journeyData
      .map((audit) =>
        audit.phases
          .filter((phase) => phase.screenshots.length > 0 || phase.comments)
          .map(
            (phase) => `
          <div class="journey-phase">
            <h3 class="phase-title">${phase.name}</h3>
            
            <div class="phase-screenshots">
              <div class="screenshot-container">
                ${phase.screenshots
                  .map(
                    (screenshot) => `
                  <img src="${screenshot.url}" 
                       alt="${screenshot.filename}" 
                       class="screenshot"
                       loading="lazy">
                `
                  )
                  .join("")}
              </div>
            </div>

            <div class="phase-content">
              <div class="phase-comments">
                <span class="phase-label">Issue & Hypothesis:</span>
                <div class="phase-text">${phase.comments}</div>
              </div>
            </div>
          </div>
        `
          )
          .join("")
      )
      .join("");
  }

  generateEyequantHtml(eyequantData) {
    return eyequantData
      .filter((audit) => audit.screenshot || audit.topFeedback || audit.bottomFeedback)
      .map(
        (audit) => `
        <div class="eyequant-container">
          <div class="eyequant-screenshot">
            ${
              audit.screenshot
                ? `
              <img src="${audit.screenshot.url}" 
                   alt="${audit.screenshot.filename}" 
                   class="eyequant-image"
                   loading="lazy">
            `
                : `
              <div style="display: flex; align-items: center; justify-content: center; height: 400px; background: #F8F9FF; border: 2px dashed #E8E4FF; border-radius: 8px; color: #6325F4;">
                No Eyequant screenshot provided
              </div>
            `
            }
          </div>
          
          <div class="eyequant-feedback">
            <div class="feedback-box">
              <div class="feedback-title">Top Feedback</div>
              <div class="feedback-text">${audit.topFeedback}</div>
            </div>
            
            <div class="feedback-box">
              <div class="feedback-title">Bottom Feedback</div>
              <div class="feedback-text">${audit.bottomFeedback}</div>
            </div>
          </div>
        </div>
      `
      )
      .join("");
  }

  // Helper method to generate multiple reports if you have multiple clients
  async generateClientReports(outputDir = "./output") {
    const detailedFindings = this.dataProcessor.getDetailedFindings();
    const clients = [...new Set(detailedFindings.map((audit) => audit.client || audit.Client))];

    const reports = [];

    for (const client of clients) {
      // Create a filtered data processor for this client
      const clientData = detailedFindings.filter((audit) => (audit.client || audit.Client) === client);
      const { default: DataProcessor } = await import("./dataProcessor.js");
      const clientProcessor = new DataProcessor(clientData);

      const clientReportGenerator = new ReportGenerator(clientProcessor);
      const filename = `${client.toLowerCase().replace(/\s+/g, "-")}.html`;
      const outputPath = path.join(outputDir, filename);

      await clientReportGenerator.generateReport(outputPath);
      reports.push(outputPath);
    }

    return reports;
  }
}

export default ReportGenerator;
