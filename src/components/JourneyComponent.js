export const generateJourneyHtml = (dataProcessor) => {
  const journeyData = dataProcessor.getUserJourneyData();
  return generateUserJourneyHtml(journeyData);
};

// Generate individual journey phase HTML
export const generateDiscoveryPhaseHtml = (dataProcessor) => {
  const journeyData = dataProcessor.getUserJourneyData();
  return generatePhaseHtml(journeyData, "Discovery phase");
};

export const generateDecisionPhaseHtml = (dataProcessor) => {
  const journeyData = dataProcessor.getUserJourneyData();
  return generatePhaseHtml(journeyData, "Decision phase");
};

export const generateConversionPhaseHtml = (dataProcessor) => {
  const journeyData = dataProcessor.getUserJourneyData();
  return generatePhaseHtml(journeyData, "Conversion phase");
};

// Helper function to generate HTML for a specific phase
const generatePhaseHtml = (journeyData, phaseName) => {
  return journeyData
    .map((audit) => {
      const phase = audit.phases.find((p) => p.name === phaseName);
      if (!phase || (phase.screenshots.length === 0 && !phase.comments)) {
        return "";
      }

      return `
        <div class="journey-phase" id="${phaseName.split(" ")[0].toLowerCase()}">
          <div class="row">
            
            <div class="phase-screenshots fade-in-left">
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
            <div class="phase-content fade-in-right text-white">
              <div class="phase-comments">
                <h3 class="phase-title">${phase.name}</h3>
                <span class="phase-label">Analysis:</span>
                <div class="phase-text"><p>${phase.comments}</p></div>
              </div>
            </div>
          </div>
        </div>
      `;
    })
    .join("");
};

const generateUserJourneyHtml = (journeyData) => {
  return journeyData
    .map((audit) =>
      audit.phases
        .filter((phase) => phase.screenshots.length > 0 || phase.comments)
        .map(
          (phase) => `
        <div class="journey-phase">
          <div class="journey-phase-wrapper">
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
          </div>

          <div class="phase-content">
            <div class="phase-comments">
              <span class="phase-label">Analysis:</span>
              <div class="phase-text"><p>${phase.comments}</p></div>
            </div>
          </div>
        </div>
      `
        )
        .join("")
    )
    .join("");
};
