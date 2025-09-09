export const generateChartScripts = (dataProcessor) => {
  const radarData = dataProcessor.getRadarChartData();
  const barData = dataProcessor.getBarChartData();
  const radarOptions = dataProcessor.getChartOptions("radar");

  // Map chart labels to criteria options
  const labelToCriteriaMap = {
    "Clarity & Purpose": "clarity",
    "Trust & Credibility": "trust",
    "Mobile Experience": "mobile",
    "Information Hierarchy": "hierarchy",
    "Friction Points": "friction",
    "Visual Design": "visual",
    "Speed & Performance": "performance",
    "User Flow Logic": "flow",
  };

  // Enhanced chart options with interactive labels
  const enhancedRadarOptions = {
    ...radarOptions,
    plugins: {
      ...radarOptions.plugins,
      legend: {
        display: false,
      },
    },
    scales: {
      ...radarOptions.scales,
      r: {
        ...radarOptions.scales.r,
        pointLabels: {
          ...radarOptions.scales.r.pointLabels,
          usePointStyle: true,
          padding: 15,
          font: {
            ...radarOptions.scales.r.pointLabels.font,
            weight: "normal",
          },
          color: "#2b0573",
          callback: function (label) {
            // Handle both string and array labels
            return Array.isArray(label) ? label : label;
          },
        },
      },
    },
    onHover: (event, activeElements) => {
      const canvas = event.native.target;
      if (activeElements.length > 0) {
        canvas.style.cursor = "pointer";
      } else {
        canvas.style.cursor = "default";
      }
    },
  };

  return `
    <script>
      let radarChart = null;
      let resizeTimeout = null;
      const radarData = ${JSON.stringify(radarData)};
      const enhancedRadarOptions = ${JSON.stringify(enhancedRadarOptions)};
      const labelToCriteriaMap = ${JSON.stringify(labelToCriteriaMap)};

      function debounce(func, wait) {
        return function executedFunction(...args) {
          const later = () => {
            clearTimeout(resizeTimeout);
            func(...args);
          };
          clearTimeout(resizeTimeout);
          resizeTimeout = setTimeout(later, wait);
        };
      }

      function centerChartOnMobile() {
        const chartContainer = document.querySelector('.chart-container');
        if (chartContainer && window.innerWidth <= 768) {
          const scrollWidth = chartContainer.scrollWidth;
          const clientWidth = chartContainer.clientWidth;
          const scrollLeft = (scrollWidth - clientWidth) / 2;
          chartContainer.scrollLeft = scrollLeft;
        }
      }

      function scrollToCriteriaExplanation(criteria) {
        console.log('Attempting to scroll to criteria:', criteria);
        const summaryExplanations = document.querySelector('.summary-explanations');
        const detailsToggle = document.getElementById('detailsToggle');
        console.log('Found summary explanations element:', summaryExplanations);
        console.log('Found details toggle button:', detailsToggle);
        
        if (summaryExplanations) {
          // Check if the details section is currently hidden
          const isHidden = !summaryExplanations.classList.contains('active');
          
          if (isHidden && detailsToggle) {
            console.log('Details section is hidden, clicking toggle button');
            detailsToggle.click();
          }
          
          // Wait a bit for the animation to complete if we just opened it
          const delay = isHidden ? 400 : 200;
          
          setTimeout(() => {
            // summaryExplanations.scrollIntoView({ 
            //   behavior: 'smooth', 
            //   block: 'start' 
            // });
            
            console.log('selectCriteria function available:', typeof selectCriteria === 'function');
            // Also trigger the criteria selection if the function exists
            if (typeof selectCriteria === 'function') {
              setTimeout(() => {
                console.log('Calling selectCriteria with:', criteria);
                selectCriteria(criteria);
              }, 200); // Small delay to allow scroll to complete
            }
          }, delay);
        } else {
          console.log('Summary explanations element not found');
        }
      }

      function addLabelHoverEffects() {
        if (!radarChart) return;
        
        const canvas = document.getElementById('radarChart');
        if (!canvas) return;

        let currentHoveredLabel = -1;

        // Add hover effect to canvas
        canvas.addEventListener('mousemove', (event) => {
          const rect = canvas.getBoundingClientRect();
          const x = event.clientX - rect.left;
          const y = event.clientY - rect.top;
          
          // Get the chart instance and check if mouse is over a label
          const chartArea = radarChart.chartArea;
          if (!chartArea) return;
          
          // Calculate distance from center to determine if hovering over labels
          const centerX = chartArea.left + chartArea.width / 2;
          const centerY = chartArea.top + chartArea.height / 2;
          const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
          const maxRadius = Math.min(chartArea.width, chartArea.height) / 2;
          
          // Check if we're in the label area
          if (distance > maxRadius * 0.7) {
            canvas.style.cursor = 'pointer';
            
            // Calculate which label we're closest to
            const angle = Math.atan2(y - centerY, x - centerX);
            // Normalize angle to 0-2π range and adjust for radar chart starting position (top)
            let normalizedAngle = (angle + Math.PI / 2 + 2 * Math.PI) % (2 * Math.PI);
            // Convert to 0-1 range and calculate label index
            const labelIndex = Math.round((normalizedAngle / (2 * Math.PI)) * radarData.labels.length) % radarData.labels.length;
            
            if (labelIndex !== currentHoveredLabel) {
              currentHoveredLabel = labelIndex;
              
              // Update chart with hover effect
              updateChartWithHover(labelIndex);
            }
          } else {
            canvas.style.cursor = 'default';
            if (currentHoveredLabel !== -1) {
              currentHoveredLabel = -1;
              updateChartWithHover(-1);
            }
          }
        });

        canvas.addEventListener('mouseleave', () => {
          canvas.style.cursor = 'default';
          if (currentHoveredLabel !== -1) {
            currentHoveredLabel = -1;
            updateChartWithHover(-1);
          }
        });

        // Add click handler for label areas
        canvas.addEventListener('click', (event) => {
          const rect = canvas.getBoundingClientRect();
          const x = event.clientX - rect.left;
          const y = event.clientY - rect.top;
          
          const chartArea = radarChart.chartArea;
          if (!chartArea) return;
          
          // Calculate distance from center to determine if clicking on labels
          const centerX = chartArea.left + chartArea.width / 2;
          const centerY = chartArea.top + chartArea.height / 2;
          const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
          const maxRadius = Math.min(chartArea.width, chartArea.height) / 2;
          
          // Check if we're in the label area
          if (distance > maxRadius * 0.7) {
            console.log("Canvas clicked in label area");
            
            // Calculate which label we're closest to
            const angle = Math.atan2(y - centerY, x - centerX);
            let normalizedAngle = (angle + Math.PI / 2 + 2 * Math.PI) % (2 * Math.PI);
            const labelIndex = Math.round((normalizedAngle / (2 * Math.PI)) * radarData.labels.length) % radarData.labels.length;
            
            const label = radarData.labels[labelIndex];
            const criteriaKey = Array.isArray(label) ? label.join(" ") : label;
            const criteria = labelToCriteriaMap[criteriaKey];
            
            console.log("Clicked label:", label, "criteriaKey:", criteriaKey, "criteria:", criteria);
            
            if (criteria) {
              scrollToCriteriaExplanation(criteria);
            } else {
              console.log("No criteria found for label:", criteriaKey);
            }
          }
        });
      }

      function updateChartWithHover(hoveredLabelIndex) {
        if (!radarChart) return;
        
        // Update the chart options to highlight the hovered label
        const updatedOptions = {
          ...enhancedRadarOptions,
          scales: {
            ...enhancedRadarOptions.scales,
            r: {
              ...enhancedRadarOptions.scales.r,
              pointLabels: {
                ...enhancedRadarOptions.scales.r.pointLabels,
                color: (context) => {
                  if (hoveredLabelIndex === -1) {
                    return '#2b0573';
                  }
                  return context.index === hoveredLabelIndex ? '#4a0d9a' : '#2b0573';
                },
                font: {
                  ...enhancedRadarOptions.scales.r.pointLabels.font,
                  weight: (context) => {
                    if (hoveredLabelIndex === -1) {
                      return '300';
                    }
                    return context.index === hoveredLabelIndex ? '500' : '300';
                  }
                }
              }
            }
          }
        };
        
        // Update the chart with new options
        radarChart.options = updatedOptions;
        radarChart.update('none'); // Update without animation for smooth hover
      }

      function resizeChart() {
        console.log("resizing chart")
        if (radarChart) {
          const canvas = document.getElementById('radarChart');
          
          // Destroy and recreate the chart to force proper sizing
          radarChart.destroy();
          
          const radarCtx = canvas.getContext('2d');
          radarChart = new Chart(radarCtx, {
            type: 'radar',
            data: ${JSON.stringify(radarData)},
            options: ${JSON.stringify(enhancedRadarOptions)}
          });
          
          centerChartOnMobile();
          addLabelHoverEffects();
        }
      }

      const debouncedResize = debounce(() => {
        console.log('Window resized to:', window.innerWidth, 'x', window.innerHeight);
        resizeChart();
      }, 100);

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
            radarChart = new Chart(radarCtx, {
              type: 'radar',
              data: ${JSON.stringify(radarData)},
              options: ${JSON.stringify(enhancedRadarOptions)}
            });
            console.log('Radar chart created');
            
            // Center the chart container on mobile
            setTimeout(centerChartOnMobile, 100);
            
            // Add hover effects after chart is created
            setTimeout(addLabelHoverEffects, 100);
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

      // Add resize listener
      window.addEventListener('resize', debouncedResize);
    </script>
    `;
};
