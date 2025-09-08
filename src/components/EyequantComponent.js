export const generateEyequantHtml = (dataProcessor) => {
  const eyequantData = dataProcessor.getEyequantData();
  // Generate eyequant content
  return generateEyequantHtmlContent(eyequantData);
};

const generateEyequantHtmlContent = (eyequantData) => {
  return eyequantData
    .filter((audit) => audit.screenshot || audit.topFeedback || audit.bottomFeedback)
    .map((audit) => {
      const hasCompetitor = audit.competitorScreenshot;
      const containerClass = hasCompetitor
        ? "eyequant-container eyequant-container--with-competitor"
        : "eyequant-container";

      if (hasCompetitor) {
        // New layout with competitor screenshot
        return `
            <div class="${containerClass}">
              <div class="feedback-box top full-width">
                <div class="feedback-title top"></div>
                <div class="feedback-text"><p>${audit.topFeedback}</p></div>
              </div>
              
              <div class="eyequant-screenshots-comparison">
                <div class="eyequant-screenshot original">
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
                
                <div class="eyequant-screenshot competitor">
                  <img src="${audit.competitorScreenshot.url}" 
                       alt="${audit.competitorScreenshot.filename}" 
                       class="eyequant-image"
                       loading="lazy">
                </div>
              </div>
              
              <div class="feedback-box bottom full-width">
                <div class="feedback-text"><p>${audit.bottomFeedback}</p></div>
                <div class="feedback-title bottom"></div>
              </div>
            </div>
          `;
      } else {
        // Original layout (single screenshot)
        return `
            <div class="${containerClass}">
              <div class="feedback-box top">
                <div class="feedback-title top"></div>
                <div class="feedback-text"><p>${audit.topFeedback}</p></div>
              </div>
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
              <div class="feedback-box bottom">
                <div class="feedback-text"><p>${audit.bottomFeedback}</p></div>
                <div class="feedback-title bottom"></div>
              </div>
            </div>
          `;
      }
    })
    .join("");
};
