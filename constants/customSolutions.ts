const ctaSection = `
<div class="qt-cta-section">
  <div class="qt-cta-animation" id="qt-lottie-cta"></div>
  <div class="qt-cta-content">
    <h3>Ready to Order?</h3>
    <p>Call the waiter or place your order directly from your phone.</p>
    <div class="qt-cta-actions">
      <a href="tel:+123456789" class="qt-btn primary">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
        </svg>
        Call Waiter
      </a>
      <a href="#menu" class="qt-btn secondary">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 12h18M3 6h18M3 18h18"></path>
        </svg>
        Back to Menu
      </a>
    </div>
  </div>
</div>

<!-- Lottie -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js"></script>
<script>
  lottie.loadAnimation({
    container: document.getElementById("qt-lottie-cta"),
    renderer: "svg",
    loop: true,
    autoplay: true,
    path: "https://assets10.lottiefiles.com/packages/lf20_jcikwtux.json"
  });
</script>

<style>
  .qt-cta-section {
    position: relative;
    display: flex;
    align-items: center;
    gap: 40px;
    padding: 60px 48px;
    margin: 48px 0;
    border-radius: 24px;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    color: #fff;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
    overflow: hidden;
  }
  
  .qt-cta-section::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 20% 50%, rgba(255, 204, 0, 0.1) 0%, transparent 50%);
    pointer-events: none;
  }
  
  .qt-cta-animation {
    width: 180px;
    height: 180px;
    flex-shrink: 0;
    position: relative;
    z-index: 1;
  }
  
  .qt-cta-content {
    flex: 1;
    position: relative;
    z-index: 1;
  }
  
  .qt-cta-content h3 {
    margin: 0 0 12px;
    font-size: 2rem;
    font-weight: 700;
    letter-spacing: -0.5px;
    background: linear-gradient(135deg, #fff 0%, #ffcc00 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .qt-cta-content p {
    margin: 0 0 28px;
    font-size: 1.1rem;
    opacity: 0.9;
    line-height: 1.6;
    max-width: 480px;
  }
  
  .qt-cta-actions {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
  }
  
  .qt-btn {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 16px 32px;
    border-radius: 12px;
    text-decoration: none;
    font-weight: 600;
    font-size: 1rem;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  .qt-btn.primary {
    background: linear-gradient(135deg, #ffcc00 0%, #ffaa00 100%);
    color: #111;
  }
  
  .qt-btn.primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(255, 204, 0, 0.4);
  }
  
  .qt-btn.secondary {
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid rgba(255, 255, 255, 0.3);
    color: #fff;
    backdrop-filter: blur(10px);
  }
  
  .qt-btn.secondary:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.5);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(255, 255, 255, 0.1);
  }
  
  .qt-btn svg {
    flex-shrink: 0;
  }
  
  /* Mobile */
  @media (max-width: 768px) {
    .qt-cta-section {
      flex-direction: column;
      text-align: center;
      padding: 48px 24px;
      gap: 32px;
    }
    
    .qt-cta-animation {
      width: 140px;
      height: 140px;
    }
    
    .qt-cta-content h3 {
      font-size: 1.75rem;
    }
    
    .qt-cta-content p {
      font-size: 1rem;
      max-width: 100%;
    }
    
    .qt-cta-actions {
      justify-content: center;
      width: 100%;
    }
    
    .qt-btn {
      flex: 1;
      min-width: 140px;
      justify-content: center;
    }
  }
</style>`;

export const customCodeTemplates = {
	ctaSection,
};
