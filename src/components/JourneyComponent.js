export const generateJourneyHtml = (dataProcessor) => {
  const journeyData = dataProcessor.getUserJourneyData();
  return generateUserJourneyHtml(journeyData);
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
