class DataProcessor {
  constructor(rawData) {
    this.rawData = rawData;
    this.categories = [
      "Clarity & Purpose",
      "Trust & Credibility",
      "Mobile Experience",
      "Information Hierarchy",
      "Friction Points",
      "Visual Design",
      "Speed & Performance",
      "User Flow Logic",
    ];
  }

  // Extract scores for radar/bar charts
  getScoreData() {
    return this.rawData.map((record) => {
      const scores = {};
      this.categories.forEach((category) => {
        const scoreField = `${category} Score`;
        scores[category] = parseInt(record.fields?.[scoreField] || record[scoreField]) || 0;
      });

      // Handle Client field as simple text field
      let clientName = "Unknown Client";
      const clientField = record.fields?.Client || record.Client;

      if (clientField && typeof clientField === "string") {
        clientName = clientField.trim();
      }

      return {
        client: clientName,
        id: record.fields?.ID || record.ID || record.id,
        scores,
      };
    });
  }

  // Get average scores across all audits for summary chart
  getAverageScores() {
    const scoreData = this.getScoreData();
    const averages = {};

    this.categories.forEach((category) => {
      const total = scoreData.reduce((sum, audit) => sum + audit.scores[category], 0);
      averages[category] = parseFloat((total / scoreData.length).toFixed(1));
    });

    return averages;
  }

  // Format data for Chart.js radar chart
  getRadarChartData(clientFilter = null) {
    const scoreData = this.getScoreData();
    const filteredData = clientFilter
      ? scoreData.filter((audit) => (audit.client || audit.Client) === clientFilter)
      : scoreData;

    const datasets = filteredData.map((audit, index) => ({
      label: `${audit.client} (ID: ${audit.id})`,
      data: this.categories.map((category) => audit.scores[category]),
      borderColor: this.getChartColor(index),
      backgroundColor: this.getChartColor(index, 0.2),
      pointBackgroundColor: this.getChartColor(index),
      pointBorderColor: "#fff",
      pointHoverBackgroundColor: "#fff",
      pointHoverBorderColor: this.getChartColor(index),
    }));

    // Process labels for multiline display
    const processedLabels = this.categories.map((category) => {
      const parts = category.split(" & ");
      if (parts.length > 1) {
        // If there's an "&", split it into lines with "&" on the first line
        return [parts[0].trim() + " &", parts[1].trim()];
      }

      // Auto-wrap long labels
      const maxLength = 15;
      if (category.length <= maxLength) return category;

      const words = category.split(" ");
      const lines = [];
      let currentLine = "";

      words.forEach((word) => {
        if ((currentLine + word).length <= maxLength) {
          currentLine += (currentLine ? " " : "") + word;
        } else {
          if (currentLine) lines.push(currentLine);
          currentLine = word;
        }
      });
      if (currentLine) lines.push(currentLine);

      return lines;
    });

    return {
      labels: processedLabels,
      datasets,
    };
  }

  // Format data for Chart.js bar chart
  getBarChartData() {
    const averages = this.getAverageScores();

    return {
      labels: this.categories,
      datasets: [
        {
          label: "Average Scores",
          data: this.categories.map((category) => averages[category]),
          backgroundColor: this.categories.map((_, index) => this.getChartColor(index, 0.6)),
          borderColor: this.categories.map((_, index) => this.getChartColor(index)),
          borderWidth: 1,
        },
      ],
    };
  }

  // Get all issues and experiments for detailed sections
  getDetailedFindings() {
    return this.rawData.map((record) => {
      // Handle Client field as simple text field
      let clientName = "Unknown Client";
      const clientField = record.fields?.Client || record.Client;
      if (clientField && typeof clientField === "string") {
        clientName = clientField.trim();
      }

      return {
        client: clientName,
        id: record.fields?.ID || record.ID || record.id,
        findings: this.categories.map((category) => ({
          category,
          score: parseInt(record.fields?.[`${category} Score`] || record[`${category} Score`]) || 0,
          issue: this.parseRichText(
            record.fields?.[`${category} Issue`] ||
              record[`${category} Issue`] ||
              record[`${category} Issues`] ||
              record[`${category} Issues`] ||
              "No issues recorded"
          ),
          experiment: this.parseRichText(
            record.fields?.[`${category} Experiments`] ||
              record[`${category} Experiments`] ||
              "No experiments suggested"
          ),
        })),
        phases: [
          {
            name: "Discovery phase",
            screenshots: this.parseScreenshots(
              record.fields?.["Discovery Phase Screenshots"] || record["Discovery Phase Screenshots"]
            ),
            comments: this.parseRichText(
              record["Discovery Phase Comments"] || record.fields?.["Discovery Phase Comments"] || "No issues recorded"
            ),
          },
          {
            name: "Decision phase",
            screenshots: this.parseScreenshots(
              record.fields?.["Decision Phase Screenshots"] || record["Decision Phase Screenshots"]
            ),
            comments: this.parseRichText(
              record["Decision Phase Comments"] || record.fields?.["Decision Phase Comments"] || "No issues recorded"
            ),
          },
          {
            name: "Conversion phase",
            screenshots: this.parseScreenshots(
              record.fields?.["Conversion Phase Screenshots"] || record["Conversion Phase Screenshots"]
            ),
            comments: this.parseRichText(
              record["Conversion Phase Comments"] ||
                record.fields?.["Conversion Phase Comments"] ||
                "No issues recorded"
            ),
          },
        ],
      };
    });
  }

  // Get summary statistics for the header cards
  getSummaryStats() {
    const scoreData = this.getScoreData();
    const averages = this.getAverageScores();

    // Calculate overall average
    const totalScore = Object.values(averages).reduce((sum, score) => sum + score, 0);
    const overallAverage = parseFloat((totalScore / this.categories.length).toFixed(1));

    // Find highest and lowest categories
    const categoryScores = Object.entries(averages);
    const highestCategory = categoryScores.reduce(
      (max, [category, score]) => (score > max[1] ? [category, score] : max),
      ["", 0]
    );
    const lowestCategory = categoryScores.reduce(
      (min, [category, score]) => (score < min[1] ? [category, score] : min),
      ["", 5]
    );

    return {
      clients: [...new Set(scoreData.map((audit) => audit.client || audit.Client))],
      overallAverage,
      highestCategory,
      lowestCategory,
      totalAudits: scoreData.length,
    };
  }

  getReportDetails() {
    // Since we're generating a report for a specific client, return details for the first record
    if (this.rawData.length === 0) {
      return {
        user: "aaaaa User",
        userId: "aaaaa",
        site: "aaaaa Site",
        reportDate: "aaaaa Date",
      };
    }

    const record = this.rawData[0];

    // Handle both data structures: record.fields.FieldName (raw Airtable) and record.FieldName (processed)
    const userField = record.fields?.User || record.User;
    const siteField = record.fields?.["Site Link"] || record["Site Link"];
    const dateField = record.fields?.["Report Date"] || record["Report Date"];

    // Format the report date if it exists
    let formattedDate = "Unknown Date";
    if (dateField) {
      try {
        const date = new Date(dateField);
        if (!isNaN(date.getTime())) {
          formattedDate = date.toLocaleDateString("en-GB", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });
        }
      } catch (error) {
        console.warn("Could not parse report date:", dateField);
      }
    }

    // Handle User field - Airtable user fields can be objects with name, email, etc.
    let userName = "Unknown User";
    let userId = "unknown";

    if (userField) {
      if (typeof userField === "string") {
        userName = userField;
      } else if (userField.name) {
        userName = userField.name;
        userId = userField.id || "unknown";
      } else if (userField.email) {
        userName = userField.email;
        userId = userField.id || "unknown";
      }
    }

    return {
      user: userName,
      userId: userId,
      site: siteField || "Unknown Site",
      reportDate: formattedDate,
    };
  }

  // Generate chart colors
  getChartColor(index, alpha = 1) {
    const colors = [
      `rgba(99, 37, 244, ${alpha})`, // Purple
      `rgba(230, 8, 52, ${alpha})`, // Red
      `rgba(0, 163, 184, ${alpha})`, // Teal
      `rgba(255, 255, 0, ${alpha})`, // Yellow
      `rgba(43, 5, 115, ${alpha})`, // Dark Purple
      `rgba(255, 107, 0, ${alpha})`, // Orange
      `rgba(0, 200, 83, ${alpha})`, // Green
      `rgba(156, 39, 176, ${alpha})`, // Light Purple
    ];
    return colors[index % colors.length];
  }

  // Get user journey data
  getUserJourneyData() {
    return this.rawData.map((record) => {
      // Handle Client field as simple text field
      let clientName = "Unknown Client";
      const clientField = record.fields?.Client || record.Client;
      if (clientField && typeof clientField === "string") {
        clientName = clientField.trim();
      }

      return {
        client: clientName,
        id: record.fields?.ID || record.ID || record.id,
        phases: [
          {
            name: "Discovery phase",
            screenshots: this.parseScreenshots(
              record.fields?.["Discovery Phase Screenshots"] || record["Discovery Phase Screenshots"]
            ),
            comments: this.parseRichText(
              record["Discovery Phase Comments"] || record.fields?.["Discovery Phase Comments"] || "No issues recorded"
            ),
          },
          {
            name: "Decision phase",
            screenshots: this.parseScreenshots(
              record.fields?.["Decision Phase Screenshots"] || record["Decision Phase Screenshots"]
            ),
            comments: this.parseRichText(
              record["Decision Phase Comments"] || record.fields?.["Decision Phase Comments"] || "No issues recorded"
            ),
          },
          {
            name: "Conversion phase",
            screenshots: this.parseScreenshots(
              record.fields?.["Conversion Phase Screenshots"] || record["Conversion Phase Screenshots"]
            ),
            comments: this.parseRichText(
              record["Conversion Phase Comments"] ||
                record.fields?.["Conversion Phase Comments"] ||
                "No issues recorded"
            ),
          },
        ],
      };
    });
  }

  // Get Eyequant data
  getEyequantData() {
    return this.rawData.map((record) => {
      // Handle Client field as simple text field
      let clientName = "Unknown Client";
      const clientField = record.fields?.Client || record.Client;
      if (clientField && typeof clientField === "string") {
        clientName = clientField.trim();
      }

      return {
        client: clientName,
        id: record.fields?.ID || record.ID || record.id,
        screenshot:
          this.parseScreenshots(record.fields?.["Eyequant Screenshot"] || record["Eyequant Screenshot"])[0] || null,
        topFeedback: this.parseRichText(
          record.fields?.["Top Feedback"] || record["Top Feedback"] || "No top feedback provided"
        ),
        bottomFeedback: this.parseRichText(
          record.fields?.["Bottom Feedback"] || record["Bottom Feedback"] || "No bottom feedback provided"
        ),
      };
    });
  }

  // Parse screenshot field into array of screenshot objects
  parseScreenshots(screenshotField) {
    if (!screenshotField) return [];

    // Handle REST API format: array of objects with url, filename, etc.
    if (Array.isArray(screenshotField)) {
      return screenshotField.map((attachment) => {
        // REST API returns attachment objects with url, filename, etc.
        if (attachment.url) {
          return { url: attachment.url, filename: attachment.filename || "screenshot.png" };
        }
        // Fallback for other object formats
        return { url: String(attachment), filename: "screenshot.png" };
      });
    }

    // Handle old format: comma-separated string
    if (typeof screenshotField === "string") {
      return screenshotField.split(",").map((url) => {
        const filename = url.split("/").pop() || "screenshot.png";
        return { url: url.trim(), filename };
      });
    }

    // Handle single object
    if (screenshotField && typeof screenshotField === "object" && screenshotField.url) {
      return [{ url: screenshotField.url, filename: screenshotField.filename || "screenshot.png" }];
    }

    return [];
  }

  // Parse rich text markdown to HTML
  parseRichText(text) {
    if (!text || typeof text !== "string") return text;

    // Convert markdown to HTML
    let html = text
      // Convert line breaks to <br> tags
      .replace(/\n/g, "</p><p>")
      // Convert **bold** to <strong> tags
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      // Convert *italic* to <em> tags
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      // Convert `code` to <code> tags
      .replace(/`(.*?)`/g, "<code>$1</code>");

    return html;
  }

  // Get chart options for Chart.js
  getChartOptions(type) {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
    };

    if (type === "radar") {
      return {
        ...baseOptions,
        scales: {
          r: {
            beginAtZero: true,
            max: 5,
            ticks: {
              stepSize: 1,
              font: {
                family: "BWGradual, Inter, sans-serif",
                size: 14,
              },
            },
            pointLabels: {
              font: {
                family: "BWGradual, Inter, sans-serif",
                size: 14,
              },
            },
          },
        },
      };
    }

    return baseOptions;
  }
}

export default DataProcessor;
