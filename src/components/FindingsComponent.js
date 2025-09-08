export const generateFindingsHtml = (dataProcessor) => {
  const detailedFindings = dataProcessor.getDetailedFindings();
  return generateDetailedFindingsHtml(detailedFindings);
};

export const generateNeedsWorkFindingsHtml = (dataProcessor) => {
  const detailedFindings = dataProcessor.getDetailedFindings();
  return generateNeedsWorkFindingsOnly(detailedFindings);
};

export const generateDoingWellFindingsHtml = (dataProcessor) => {
  const detailedFindings = dataProcessor.getDetailedFindings();
  return generateDoingWellFindingsOnly(detailedFindings);
};

const generateDetailedFindingsHtml = (detailedFindings) => {
  return detailedFindings
    .map((audit) => {
      // Split findings into two categories and sort them
      const needsWork = audit.findings.filter((finding) => finding.score <= 3).sort((a, b) => a.score - b.score); // Lowest to highest

      const doingWell = audit.findings.filter((finding) => finding.score > 3).sort((a, b) => b.score - a.score); // Highest to lowest

      return `
        <div class="client-findings">
          ${generateFindingsSection(needsWork, "needs-work", "Things to consider")}
          ${generateFindingsSection(doingWell, "doing-well", "What you're doing well so far")}
        </div>
      `;
    })
    .join("");
};

const generateFindingsSection = (findings, className, title) => {
  if (findings.length === 0) return "";

  const findingsHtml = findings
    .map((finding, i) => {
      const scoreClass = `score-${finding.score}`;
      return `
        <div class="category-findings ${className}-item ${scoreClass} fade-in-left fade-in-delay-${
        i + 3
      }00 bg-grey rounded-lg">
          <div class="category-header">
            <div class="category-name">
              <span class="score-indicator ${scoreClass}"></span>
              ${finding.category}
            </div>
            <div class="category-score"><span class="score">${
              finding.score
            }</span><span class="subtext">of 5</span></div>
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
    <h4 class="subsection-title ${className} fade-in-up fade-in-delay-200"><span>${title}</span></h4>
      <div class="findings-subsection">        
        ${findingsHtml}
      </div>
    `;
};

const generateNeedsWorkFindingsOnly = (detailedFindings) => {
  return detailedFindings
    .map((audit) => {
      // Filter only findings that need work (score <= 3) and sort them
      const needsWork = audit.findings.filter((finding) => finding.score <= 3).sort((a, b) => a.score - b.score); // Lowest to highest

      return `
        <div class="client-findings col-12">
          ${generateFindingsSection(needsWork, "needs-work", "Things to consider")}
        </div>
      `;
    })
    .join("");
};

const generateDoingWellFindingsOnly = (detailedFindings) => {
  return detailedFindings
    .map((audit) => {
      // Filter only findings that are doing well (score > 3) and sort them
      const doingWell = audit.findings.filter((finding) => finding.score > 3).sort((a, b) => b.score - a.score); // Highest to lowest

      return `
        <div class="client-findings">
          ${generateFindingsSection(doingWell, "doing-well", "What you're doing well")}
        </div>
      `;
    })
    .join("");
};
