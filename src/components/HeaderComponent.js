export const generateHeaderHtml = (dataProcessor) => {
  const reportDetails = dataProcessor.getReportDetails();
  const { user, userId, site, reportDate } = reportDetails;

  return `
    <header class="container full header">
      <div class="container">
        <h1>Digital Experience Audit Report</h1>
        <p>Analysis of ${site} for {{CLIENT_NAME}}</p>
        <div class="user--details">
          <span class="icon--${userId}"></span>
          <p>
            <span class="subtext">Conducted by</span><span class="report--user">${user}</span
            ><span class="report--date">${reportDate}</span>
          </p>
        </div>
      </div>
    </header>
  `;
};
