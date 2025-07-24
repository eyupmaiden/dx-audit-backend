const fs = require('fs').promises;
const path = require('path');

class ReportGenerator {
    constructor(dataProcessor) {
        this.dataProcessor = dataProcessor;
        console.log('ReportGenerator constructed with dataProcessor:', !!dataProcessor);
    }

    async generateReport(outputPath = './output/audit-report.html') {
        console.log('generateReport method called with outputPath:', outputPath);
        try {
            // Read the HTML template
            const templatePath = path.join(__dirname, 'templates', 'report.html');
            let htmlTemplate = await fs.readFile(templatePath, 'utf8');

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
            htmlTemplate = htmlTemplate.replace('{{CHART_SCRIPTS}}', chartScripts);

            // Ensure output directory exists
            const outputDir = path.dirname(outputPath);
            await fs.mkdir(outputDir, { recursive: true });

            // Write the final HTML file
            await fs.writeFile(outputPath, htmlTemplate, 'utf8');
            
            console.log(`✅ Report generated successfully: ${outputPath}`);
            return outputPath;

        } catch (error) {
            console.error('Error generating report:', error);
            throw error;
        }
    }

    replacePlaceholders(template, summaryStats, detailedFindings, journeyData, eyequantData) {
        const clientName = summaryStats.clients.join(', ');
        const reportDate = new Date().toLocaleDateString('en-GB', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        let html = template
            .replace(/{{CLIENT_NAME}}/g, clientName)
            .replace(/{{REPORT_DATE}}/g, reportDate)
            .replace(/{{OVERALL_AVERAGE}}/g, summaryStats.overallAverage)
            .replace(/{{HIGHEST_CATEGORY_NAME}}/g, summaryStats.highestCategory[0])
            .replace(/{{HIGHEST_CATEGORY_SCORE}}/g, summaryStats.highestCategory[1])
            .replace(/{{LOWEST_CATEGORY_NAME}}/g, summaryStats.lowestCategory[0])
            .replace(/{{LOWEST_CATEGORY_SCORE}}/g, summaryStats.lowestCategory[1])
            .replace(/{{TOTAL_AUDITS}}/g, summaryStats.totalAudits);

        // Generate detailed findings HTML
        const findingsHtml = this.generateDetailedFindingsHtml(detailedFindings);
        html = html.replace('{{DETAILED_FINDINGS}}', findingsHtml);

        // Generate user journey HTML
        const journeyHtml = this.generateUserJourneyHtml(journeyData);
        html = html.replace('{{USER_JOURNEY_CONTENT}}', journeyHtml);

        // Generate Eyequant HTML
        const eyequantHtml = this.generateEyequantHtml(eyequantData);
        html = html.replace('{{EYEQUANT_CONTENT}}', eyequantHtml);

        return html;
    }

    generateDetailedFindingsHtml(detailedFindings) {
        let html = '';

        detailedFindings.forEach(audit => {
            // Split findings into two categories and sort them
            const needsWork = audit.findings
                .filter(finding => finding.score <= 3)
                .sort((a, b) => a.score - b.score); // Lowest to highest

            const doingWell = audit.findings
                .filter(finding => finding.score > 3)
                .sort((a, b) => b.score - a.score); // Highest to lowest

            html += `
                <div class="client-findings">
                    <h3 class="client-title">${audit.client} (Audit ID: ${audit.id})</h3>
            `;

            // What needs work section
            if (needsWork.length > 0) {
                html += `
                    <div class="findings-subsection">
                        <h4 class="subsection-title needs-work">What needs work</h4>
                `;
                
                needsWork.forEach(finding => {
                    const scoreClass = `score-${finding.score}`;
                    html += `
                        <div class="category-findings needs-work-item">
                            <div class="category-header">
                                <div class="category-name">
                                    <span class="score-indicator ${scoreClass}"></span>
                                    ${finding.category}
                                </div>
                                <div class="category-score">${finding.score}/5</div>
                            </div>
                            <div class="finding-item">
                                <div class="finding-label">Issue Identified:</div>
                                <div class="finding-text">${finding.issue}</div>
                            </div>
                            <div class="finding-item">
                                <div class="finding-label">Recommended Experiment:</div>
                                <div class="finding-text">${finding.experiment}</div>
                            </div>
                        </div>
                    `;
                });

                html += `</div>`;
            }

            // What you're doing well section
            if (doingWell.length > 0) {
                html += `
                    <div class="findings-subsection">
                        <h4 class="subsection-title doing-well">What you're doing well</h4>
                `;
                
                doingWell.forEach(finding => {
                    const scoreClass = `score-${finding.score}`;
                    html += `
                        <div class="category-findings doing-well-item">
                            <div class="category-header">
                                <div class="category-name">
                                    <span class="score-indicator ${scoreClass}"></span>
                                    ${finding.category}
                                </div>
                                <div class="category-score">${finding.score}/5</div>
                            </div>
                            <div class="finding-item">
                                <div class="finding-label">What's working:</div>
                                <div class="finding-text">${finding.issue}</div>
                            </div>
                            <div class="finding-item">
                                <div class="finding-label">Potential Enhancement:</div>
                                <div class="finding-text">${finding.experiment}</div>
                            </div>
                        </div>
                    `;
                });

                html += `</div>`;
            }

            html += `</div>`;
        });

        return html;
    }

    generateChartScripts(radarData, barData) {
        const radarOptions = this.dataProcessor.getChartOptions('radar');

        return `
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
        `;
    }

    generateUserJourneyHtml(journeyData) {
        let html = '';

        journeyData.forEach(audit => {
            audit.phases.forEach(phase => {
                if (phase.screenshots.length > 0 || phase.comments) {
                    html += `
                        <div class="journey-phase">
                            <h3 class="phase-title">${phase.name}</h3>
                            
                            <div class="phase-screenshots">
                                <div class="screenshot-container">
                    `;

                    // Add screenshots if available
                    phase.screenshots.forEach(screenshot => {
                        html += `
                            <img src="${screenshot.url}" 
                                 alt="${screenshot.filename}" 
                                 class="screenshot"
                                 loading="lazy">
                        `;
                    });

                    html += `
                                </div>
                            </div>

                            <div class="phase-content">
                                <div class="phase-comments">
                                    <span class="phase-label">Issue & Hypothesis:</span>
                                    <div class="phase-text">${phase.comments}</div>
                                </div>
                            </div>
                        </div>
                    `;
                }
            });
        });

        return html;
    }

    generateEyequantHtml(eyequantData) {
        let html = '';

        eyequantData.forEach(audit => {
            if (audit.screenshot || audit.topFeedback || audit.bottomFeedback) {
                html += `
                    <div class="eyequant-container">
                        <div class="eyequant-screenshot">
                `;

                if (audit.screenshot) {
                    html += `
                        <img src="${audit.screenshot.url}" 
                             alt="${audit.screenshot.filename}" 
                             class="eyequant-image"
                             loading="lazy">
                    `;
                } else {
                    html += `
                        <div style="display: flex; align-items: center; justify-content: center; height: 400px; background: #F8F9FF; border: 2px dashed #E8E4FF; border-radius: 8px; color: #6325F4;">
                            No Eyequant screenshot provided
                        </div>
                    `;
                }

                html += `
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
                `;
            }
        });

        return html;
    }

    // Helper method to generate multiple reports if you have multiple clients
    async generateClientReports(outputDir = './output') {
        const detailedFindings = this.dataProcessor.getDetailedFindings();
        const clients = [...new Set(detailedFindings.map(audit => audit.client))];
        
        const reports = [];
        
        for (const client of clients) {
            // Create a filtered data processor for this client
            const clientData = detailedFindings.filter(audit => audit.client === client);
            const clientProcessor = new (require('./dataProcessor'))(clientData);
            
            const clientReportGenerator = new ReportGenerator(clientProcessor);
            const filename = `${client.toLowerCase().replace(/\s+/g, '-')}-audit-report.html`;
            const outputPath = path.join(outputDir, filename);
            
            await clientReportGenerator.generateReport(outputPath);
            reports.push(outputPath);
        }
        
        return reports;
    }
}

module.exports = ReportGenerator;