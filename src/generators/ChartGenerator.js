export const generateChartScripts = (dataProcessor) => {
  const radarData = dataProcessor.getRadarChartData();
  const barData = dataProcessor.getBarChartData();
  const radarOptions = dataProcessor.getChartOptions("radar");

  return `
    <script>
      function initCharts() {
        console.log('Initializing charts...');
        console.log('Chart.js available:', typeof Chart !== 'undefined');
        
        if (typeof Chart === 'undefined') {
          console.error('Chart.js not loaded');
          return;
        }

        try {
          // Radar Chart
          const radarCanvas = document.getElementById('radarChart');
          if (radarCanvas) {
            const radarCtx = radarCanvas.getContext('2d');
            new Chart(radarCtx, {
              type: 'radar',
              data: ${JSON.stringify(radarData)},
              options: ${JSON.stringify(radarOptions)}
            });
            console.log('Radar chart created');
            
            // Center the chart container on mobile
            setTimeout(() => {
              const chartContainer = document.querySelector('.chart-container');
              if (chartContainer && window.innerWidth <= 768) {
                const scrollWidth = chartContainer.scrollWidth;
                const clientWidth = chartContainer.clientWidth;
                const scrollLeft = (scrollWidth - clientWidth) / 2;
                chartContainer.scrollLeft = scrollLeft;
              }
            }, 100);
          }
        } catch (error) {
          console.error('Chart creation error:', error);
        }
      }

      // Wait for everything to load
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCharts);
      } else {
        initCharts();
      }
    </script>
    `;
};
