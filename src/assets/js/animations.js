/**
 * Intersection Observer Animation System
 * Handles scroll-triggered animations for elements with animation classes
 */

class AnimationObserver {
  constructor() {
    this.observer = null;
    this.init();
  }

  init() {
    // Check if IntersectionObserver is supported
    if (!("IntersectionObserver" in window)) {
      console.warn("IntersectionObserver not supported, falling back to immediate animation");
      this.fallbackAnimation();
      return;
    }

    // Create intersection observer
    this.observer = new IntersectionObserver((entries) => this.handleIntersection(entries), {
      threshold: 0.1, // Element must be 10% visible (much more responsive)
      rootMargin: "0px 0px -5% 0px", // Start animation when element is 5% from bottom of viewport
    });

    // Observe all elements with animation classes
    this.observeElements();

    // Check for elements already visible on page load
    this.checkInitialVisibility();
  }

  observeElements() {
    const animationSelectors = [
      ".fade-in",
      ".fade-in-up",
      ".fade-in-down",
      ".fade-in-left",
      ".fade-in-right",
      ".slide-in",
    ];

    animationSelectors.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((element) => {
        this.observer.observe(element);
      });
    });
  }

  checkInitialVisibility() {
    // Check if elements are already visible on page load
    const animationSelectors = [
      ".fade-in",
      ".fade-in-up",
      ".fade-in-down",
      ".fade-in-left",
      ".fade-in-right",
      ".slide-in",
    ];

    animationSelectors.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((element) => {
        const rect = element.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;

        if (isVisible && !element.classList.contains("loaded")) {
          // Element is already visible, animate it immediately
          setTimeout(() => {
            element.classList.add("loaded");
            this.observer.unobserve(element);
          }, 100); // Small delay to ensure smooth animation
        }
      });
    });
  }

  handleIntersection(entries) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        // Add loaded class to trigger animation
        entry.target.classList.add("loaded");

        // Stop observing this element to prevent re-animation
        this.observer.unobserve(entry.target);
      }
    });
  }

  fallbackAnimation() {
    // For browsers without IntersectionObserver support
    // Add loaded class to all animation elements immediately
    const animationSelectors = [
      ".fade-in",
      ".fade-in-up",
      ".fade-in-down",
      ".fade-in-left",
      ".fade-in-right",
      ".slide-in",
    ];

    animationSelectors.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((element) => {
        element.classList.add("loaded");
      });
    });
  }

  // Method to manually trigger animation for specific element
  triggerAnimation(element) {
    if (element && element.classList.contains("loaded") === false) {
      element.classList.add("loaded");
      if (this.observer) {
        this.observer.unobserve(element);
      }
    }
  }

  // Method to reset animation (useful for testing)
  resetAnimation(element) {
    if (element) {
      element.classList.remove("loaded");
      if (this.observer) {
        this.observer.observe(element);
      }
    }
  }
}

// Initialize animation observer when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.animationObserver = new AnimationObserver();
});

// Export for potential use in other scripts
if (typeof module !== "undefined" && module.exports) {
  module.exports = AnimationObserver;
}
