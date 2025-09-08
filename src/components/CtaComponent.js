export const generateCtaHtml = (dataProcessor) => {
  return `
      <div class="container full cta-section">
        <div class="container">
          <!-- CRO Services CTA -->
          <h2 class="cta-title">Ready to turn these insights into <span class="squiggle-underline">results?</span></h2>
          <p class="cta-subtitle">
            Our CRO experts are ready to implement and test these recommendations to drive measurable improvements to your
            conversion rates.
          </p>

          <div class="cta-benefits">
            <div class="benefit-item">
              <span class="benefit-text">Data-driven experiment design</span>
            </div>
            <div class="benefit-item">
              <span class="benefit-text">Expert implementation & testing</span>
            </div>
            <div class="benefit-item">
              <span class="benefit-text">Ongoing optimisation & insights</span>
            </div>
          </div>

          <a
            href="mailto:conversion@journeyfurther.com?subject=CRO Services Enquiry - {{CLIENT_NAME}}&body=Hi,%0D%0A%0D%0AI've reviewed the UX audit report for {{CLIENT_NAME}} and I'm interested in discussing what CRO can do for my website.%0D%0A%0D%0ACould we schedule a call to discuss how Journey Further can help implement these recommendations and drive measurable improvements?%0D%0A%0D%0AThanks!"
            class="cta-button">
            Get Started with CRO Services
          </a>

          <p class="cta-contact">
            Or email directly:
            <a href="mailto:conversion@journeyfurther.com" class="email-link">conversion@journeyfurther.com</a>
          </p>
        </div>
      </div>
    `;
};
