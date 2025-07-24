class DataProcessor {
    constructor(rawData) {
        this.rawData = rawData;
        this.categories = [
            'Clarity & Purpose',
            'Trust & Credibility', 
            'Mobile Experience',
            'Information Hierarchy',
            'Friction Points',
            'Visual Design',
            'Speed & Performance',
            'User Flow Logic'
        ];
    }

    // Extract scores for radar/bar charts
    getScoreData() {
        const scoreData = this.rawData.map(record => {
            const scores = {};
            this.categories.forEach(category => {
                const scoreField = `${category} Score`;
                scores[category] = parseInt(record[scoreField]) || 0;
            });
            return {
                client: record.Client || 'Unknown Client',
                id: record.ID,
                scores: scores
            };
        });

        return scoreData;
    }

    // Get average scores across all audits for summary chart
    getAverageScores() {
        const scoreData = this.getScoreData();
        const averages = {};
        
        this.categories.forEach(category => {
            const total = scoreData.reduce((sum, audit) => sum + audit.scores[category], 0);
            averages[category] = parseFloat((total / scoreData.length).toFixed(1));
        });

        return averages;
    }

    // Format data for Chart.js radar chart
    getRadarChartData(clientFilter = null) {
        const scoreData = this.getScoreData();
        const filteredData = clientFilter 
            ? scoreData.filter(audit => audit.client === clientFilter)
            : scoreData;

        const datasets = filteredData.map((audit, index) => ({
            label: `${audit.client} (ID: ${audit.id})`,
            data: this.categories.map(category => audit.scores[category]),
            borderColor: this.getChartColor(index),
            backgroundColor: this.getChartColor(index, 0.2),
            pointBackgroundColor: this.getChartColor(index),
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: this.getChartColor(index)
        }));

        return {
            labels: this.categories,
            datasets: datasets
        };
    }

    // Format data for Chart.js bar chart
    getBarChartData() {
        const averages = this.getAverageScores();
        
        return {
            labels: this.categories,
            datasets: [{
                label: 'Average Scores',
                data: this.categories.map(category => averages[category]),
                backgroundColor: this.categories.map((_, index) => this.getChartColor(index, 0.6)),
                borderColor: this.categories.map((_, index) => this.getChartColor(index)),
                borderWidth: 1
            }]
        };
    }

    // Get all issues and experiments for detailed sections
    getDetailedFindings() {
        return this.rawData.map(record => ({
            client: record.Client || 'Unknown Client',
            id: record.ID,
            findings: this.categories.map(category => ({
                category: category,
                score: parseInt(record[`${category} Score`]) || 0,
                issue: record[`${category} Issue`] || record[`${category} Issues`] || 'No issues recorded',
                experiment: record[`${category} Experiments`] || 'No experiments suggested'
            }))
        }));
    }

    // Get summary statistics
    getSummaryStats() {
        const scoreData = this.getScoreData();
        const averages = this.getAverageScores();
        
        // Find highest and lowest scoring categories
        const sortedCategories = Object.entries(averages)
            .sort(([,a], [,b]) => b - a);
        
        const overallAverage = Object.values(averages)
            .reduce((sum, score) => sum + score, 0) / this.categories.length;

        return {
            totalAudits: scoreData.length,
            overallAverage: parseFloat(overallAverage.toFixed(1)),
            highestCategory: sortedCategories[0],
            lowestCategory: sortedCategories[sortedCategories.length - 1],
            clients: [...new Set(scoreData.map(audit => audit.client))]
        };
    }

    // Helper method for consistent chart colours using Journey Further brand colors
    getChartColor(index, alpha = 1) {
        const colors = [
            `rgba(43, 5, 115, ${alpha})`,     // Indigo
            `rgba(99, 37, 244, ${alpha})`,    // Purple  
            `rgba(230, 8, 52, ${alpha})`,     // Red
            `rgba(0, 163, 184, ${alpha})`,    // Teal
            `rgba(232, 228, 255, ${alpha})`,  // Pastel purple
            `rgba(207, 236, 255, ${alpha})`,  // Pastel blue
            `rgba(253, 228, 225, ${alpha})`,  // Pastel pink
            `rgba(218, 242, 238, ${alpha})`   // Pastel green
        ];
        return colors[index % colors.length];
    }

    // Get user journey data for the journey section
    getUserJourneyData() {
        return this.rawData.map(record => ({
            client: record.Client || 'Unknown Client',
            id: record.ID,
            phases: [
                {
                    name: 'Discovery phase',
                    screenshots: this.parseScreenshots(record['Discovery Phase Screenshots']),
                    comments: record['Discovery Phase Comments'] || 'No comments provided'
                },
                {
                    name: 'Decision phase', 
                    screenshots: this.parseScreenshots(record['Decision Phase Screenshots']),
                    comments: record['Decision Phase Comments'] || 'No comments provided'
                },
                {
                    name: 'Conversion phase',
                    screenshots: this.parseScreenshots(record['Conversion Phase Screenshots']),
                    comments: record['Conversion Phase Comments'] || 'No comments provided'
                }
            ]
        }));
    }

    // Get Eyequant data for the visual attention analysis section
    getEyequantData() {
        return this.rawData.map(record => ({
            client: record.Client || 'Unknown Client',
            id: record.ID,
            screenshot: this.parseScreenshots(record['Eyequant Screenshot'])[0] || null,
            topFeedback: record['Top Feedback'] || 'No feedback provided for top section',
            bottomFeedback: record['Bottom Feedback'] || 'No feedback provided for bottom section'
        }));
    }

    // Helper method to parse screenshot URLs from Airtable attachment fields
    parseScreenshots(screenshotField) {
        if (!screenshotField || !Array.isArray(screenshotField)) {
            return [];
        }
        
        // Airtable attachments come as an array of objects with url, filename, etc.
        return screenshotField.map(attachment => ({
            url: attachment.url,
            filename: attachment.filename || 'Screenshot'
        }));
    }
    getChartOptions(type) {
        const baseOptions = {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                }
            }
        };

        if (type === 'radar') {
            return {
                ...baseOptions,
                plugins: {
                    ...baseOptions.plugins,
                    title: {
                        ...baseOptions.plugins.title,
                        text: 'UX Audit Scores by Category'
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 5,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            };
        }

        if (type === 'bar') {
            return {
                ...baseOptions,
                plugins: {
                    ...baseOptions.plugins,
                    title: {
                        ...baseOptions.plugins.title,
                        text: 'Average Scores Across All Audits'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 5,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            };
        }

        return baseOptions;
    }
}

module.exports = DataProcessor;