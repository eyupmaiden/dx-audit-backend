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

    // Detect mobile devices (screen width <= 959px)
    this.isMobile = window.innerWidth <= 959;

    // Create intersection observer with mobile-optimized settings
    const observerOptions = this.isMobile
      ? {
          threshold: 0.05, // Element must be 5% visible on mobile (more responsive)
          rootMargin: "0px 0px -20% 0px", // Start animation when element is 10% from bottom on mobile
        }
      : {
          threshold: 0.1, // Element must be 10% visible on desktop
          rootMargin: "0px 0px -5% 0px", // Start animation when element is 5% from bottom on desktop
        };

    this.observer = new IntersectionObserver((entries) => this.handleIntersection(entries), observerOptions);

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

    // Use more generous visibility check on mobile
    const visibilityThreshold = this.isMobile ? window.innerHeight * 0.1 : 0;

    animationSelectors.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((element) => {
        const rect = element.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight + visibilityThreshold && rect.bottom > -visibilityThreshold;

        if (isVisible && !element.classList.contains("loaded")) {
          // Element is already visible, animate it immediately
          const delay = this.isMobile ? 50 : 100; // Faster animation on mobile
          setTimeout(() => {
            element.classList.add("loaded");
            this.observer.unobserve(element);
          }, delay);
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

  // Method to handle window resize and update mobile detection
  handleResize() {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth <= 959;

    // If mobile state changed, recreate observer with new settings
    if (wasMobile !== this.isMobile && this.observer) {
      // Disconnect current observer
      this.observer.disconnect();

      // Create new observer with updated settings
      const observerOptions = this.isMobile
        ? {
            threshold: 0.05,
            rootMargin: "0px 0px -10% 0px",
          }
        : {
            threshold: 0.1,
            rootMargin: "0px 0px -5% 0px",
          };

      this.observer = new IntersectionObserver((entries) => this.handleIntersection(entries), observerOptions);

      // Re-observe all elements
      this.observeElements();
    }
  }
}

// Initialize animation observer when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.animationObserver = new AnimationObserver();

  // Add resize listener to handle mobile/desktop transitions
  window.addEventListener("resize", () => {
    if (window.animationObserver) {
      window.animationObserver.handleResize();
    }
  });
});

// Export for potential use in other scripts
if (typeof module !== "undefined" && module.exports) {
  module.exports = AnimationObserver;
}
