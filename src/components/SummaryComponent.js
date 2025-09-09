export const generateSummaryHtml = (dataProcessor) => {
  const summaryStats = dataProcessor.getSummaryStats();
  const { overallAverage, highestCategory, lowestCategory } = summaryStats;

  return `
    <div class="summary-grid">
      <div class="summary-card">
        <h3>Overall Score</h3>
        <div class="value">${overallAverage}</div>
        <div class="label">out / 5</div>
      </div>
      <div class="summary-card">
        <h3>Highest Performing</h3>
        <div class="value">${highestCategory[1]}</div>
        <div class="label">${highestCategory[0]}</div>
      </div>
      <div class="summary-card">
        <h3>Needs Attention</h3>
        <div class="value">${lowestCategory[1]}</div>
        <div class="label">${lowestCategory[0]}</div>
      </div>
    </div>
  `;
};
