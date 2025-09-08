export const replacePlaceholders = (template, reportDetails, summaryStats) => {
  const { clients, overallAverage, highestCategory, lowestCategory, totalAudits } = summaryStats;
  const { user, userId, site, reportDate } = reportDetails;
  const clientName = clients.join(", ");

  // Generate asset version for cache busting
  const assetVersion = Date.now().toString();

  const replacements = {
    "{{USER}}": user,
    "{{USER_ID}}": userId,
    "{{SITE}}": site,
    "{{CLIENT_NAME}}": clientName,
    "{{REPORT_DATE}}": reportDate,
    "{{OVERALL_AVERAGE}}": overallAverage,
    "{{HIGHEST_CATEGORY_NAME}}": highestCategory[0],
    "{{HIGHEST_CATEGORY_SCORE}}": highestCategory[1],
    "{{LOWEST_CATEGORY_NAME}}": lowestCategory[0],
    "{{LOWEST_CATEGORY_SCORE}}": lowestCategory[1],
    "{{TOTAL_AUDITS}}": totalAudits,
    "{{ASSET_VERSION}}": assetVersion,
  };

  let html = template;
  Object.entries(replacements).forEach(([placeholder, value]) => {
    html = html.replace(new RegExp(placeholder, "g"), value);
  });

  return html;
};
