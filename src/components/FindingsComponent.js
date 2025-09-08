export const generateFindingsHtml = (dataProcessor) => {
  const detailedFindings = dataProcessor.getDetailedFindings();
  return generateDetailedFindingsHtml(detailedFindings);
};

const generateDetailedFindingsHtml = (detailedFindings) => {
  return detailedFindings
    .map((audit) => {
      // Split findings into two categories and sort them
      const needsWork = audit.findings.filter((finding) => finding.score <= 3).sort((a, b) => a.score - b.score); // Lowest to highest

      const doingWell = audit.findings.filter((finding) => finding.score > 3).sort((a, b) => b.score - a.score); // Highest to lowest

      return `
        <div class="client-findings">
          ${generateFindingsSection(needsWork, "needs-work", "What needs work")}
          ${generateFindingsSection(doingWell, "doing-well", "What you're doing well")}
        </div>
      `;
    })
    .join("");
};

const generateFindingsSection = (findings, className, title) => {
  if (findings.length === 0) return "";

  const findingsHtml = findings
    .map((finding) => {
      const scoreClass = `score-${finding.score}`;
      return `
        <div class="category-findings ${className}-item ${scoreClass}">
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
        <h4 class="subsection-title ${className}"><span>${title}</span></h4>
        ${findingsHtml}
      </div>
    `;
};
