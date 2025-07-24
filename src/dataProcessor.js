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
      return {
        client: record.fields?.Client || record.Client || "Unknown Client",
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
    return this.rawData.map((record) => ({
      client: record.fields?.Client || record.Client || "Unknown Client",
      id: record.fields?.ID || record.ID || record.id,
      findings: this.categories.map((category) => ({
        category,
        score: parseInt(record.fields?.[`${category} Score`] || record[`${category} Score`]) || 0,
        issue:
          record.fields?.[`${category} Issue`] ||
          record[`${category} Issue`] ||
          record.fields?.[`${category} Issues`] ||
          record[`${category} Issues`] ||
          "No issues recorded",
        experiment:
          record.fields?.[`${category} Experiments`] || record[`${category} Experiments`] || "No experiments suggested",
      })),
    }));
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
    return this.rawData.map((record) => ({
      client: record.fields?.Client || record.Client || "Unknown Client",
      id: record.fields?.ID || record.ID || record.id,
      phases: [
        {
          name: "Discovery phase",
          screenshots: this.parseScreenshots(
            record.fields?.["Discovery Phase Screenshots"] || record["Discovery Phase Screenshots"]
          ),
          comments:
            record.fields?.["Discovery Phase Comments"] || record["Discovery Phase Comments"] || "No issues recorded",
        },
        {
          name: "Decision phase",
          screenshots: this.parseScreenshots(
            record.fields?.["Decision Phase Screenshots"] || record["Decision Phase Screenshots"]
          ),
          comments:
            record.fields?.["Decision Phase Comments"] || record["Decision Phase Comments"] || "No issues recorded",
        },
        {
          name: "Conversion phase",
          screenshots: this.parseScreenshots(
            record.fields?.["Conversion Phase Screenshots"] || record["Conversion Phase Screenshots"]
          ),
          comments:
            record.fields?.["Conversion Phase Comments"] || record["Conversion Phase Comments"] || "No issues recorded",
        },
      ],
    }));
  }

  // Get Eyequant data
  getEyequantData() {
    return this.rawData.map((record) => ({
      client: record.fields?.Client || record.Client || "Unknown Client",
      id: record.fields?.ID || record.ID || record.id,
      screenshot:
        this.parseScreenshots(record.fields?.["Eyequant Screenshot"] || record["Eyequant Screenshot"])[0] || null,
      topFeedback: record.fields?.["Top Feedback"] || record["Top Feedback"] || "No top feedback provided",
      bottomFeedback: record.fields?.["Bottom Feedback"] || record["Bottom Feedback"] || "No bottom feedback provided",
    }));
  }

  // Parse screenshot field into array of screenshot objects
  parseScreenshots(screenshotField) {
    if (!screenshotField) return [];

    return screenshotField.split(",").map((url) => {
      const filename = url.split("/").pop() || "screenshot.png";
      return { url: url.trim(), filename };
    });
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
