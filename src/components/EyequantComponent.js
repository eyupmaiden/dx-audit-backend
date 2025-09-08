export const generateEyequantHtml = (dataProcessor) => {
  const eyequantData = dataProcessor.getEyequantData();
  // Generate eyequant content
  return generateEyequantHtmlContent(eyequantData);
};

const generateEyequantHtmlContent = (eyequantData) => {
  return eyequantData
    .filter((audit) => (audit.screenshot && audit.screenshot.length > 0) || audit.topFeedback || audit.bottomFeedback)
    .map((audit) => {
      // Handle screenshot as array, limited to first 2 images
      const screenshots = Array.isArray(audit.screenshot) ? audit.screenshot.slice(0, 2) : [];

      const hasMultipleImages = screenshots.length > 1;
      const containerClass = hasMultipleImages
        ? "eyequant-container eyequant-container--multiple"
        : "eyequant-container";

      // Generate screenshot HTML
      const generateScreenshotHtml = (screenshot, index = 0) => {
        if (!screenshot) {
          return `
            <div class="eyequant-screenshot">
              <div style="display: flex; align-items: center; justify-content: center; height: 400px; background: #F8F9FF; border: 2px dashed #E8E4FF; border-radius: 8px; color: #6325F4;">
                No Eyequant screenshot provided
              </div>
            </div>
          `;
        }

        return `
          <div class="eyequant-screenshot">
            <img src="${screenshot.url}" 
                 alt="${screenshot.filename}" 
                 class="eyequant-image"
                 loading="lazy">
          </div>
        `;
      };

      // Generate screenshots section
      const screenshotsHtml =
        screenshots.length > 0
          ? screenshots.map((screenshot, index) => generateScreenshotHtml(screenshot, index)).join("")
          : generateScreenshotHtml(null);

      return `
        <div class="${containerClass}">
          <div class="feedback-box top fade-in-right fade-in-delay-400">
            <div class="feedback-title top"></div>
            <div class="feedback-text"><p>${audit.topFeedback}</p></div>
          </div>
          
          <div class="eyequant-screenshots ${
            hasMultipleImages ? "eyequant-screenshots--multiple" : ""
          } fade-in-left fade-in-delay-200">
            ${screenshotsHtml}
          </div>
          
          <div class="feedback-box bottom fade-in-right fade-in-delay-400">
            <div class="feedback-text"><p>${audit.bottomFeedback}</p></div>
            <div class="feedback-title bottom"></div>
          </div>
        </div>
      `;
    })
    .join("");
};
