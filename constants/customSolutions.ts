const ctaSection = `
<div class="qt-cta-section">
  <div class="qt-cta-animation"></div>
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
  (function initLottie() {
    if (typeof lottie === "undefined") { setTimeout(initLottie, 100); return; }
    document.querySelectorAll('.qt-cta-animation:not(.lottie-init)').forEach(function(el) {
      el.classList.add('lottie-init');
      el.innerHTML = '';
      lottie.loadAnimation({
        container: el,
        renderer: "svg",
        loop: true,
        autoplay: true,
        path: "https://assets10.lottiefiles.com/packages/lf20_jcikwtux.json"
      });
    });
  })();
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

// ─────────────────────────────────────────────
// 2. jewelryCollection
// ─────────────────────────────────────────────
const jewelryCollection = `
<div class="qt-jewelry-section">
  <div class="qt-jewelry-content">
    <span class="qt-jw-eyebrow">New Collection</span>
    <h3>Elegance<br>Redefined</h3>
    <p>Discover our exclusive diamond collection crafted for perfection.</p>
    <div class="qt-jw-divider"></div>
    <a href="#collection" class="qt-btn-jewelry">
      <span>Shop Now</span>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </a>
  </div>
  <div class="qt-jewelry-right">
    <div class="qt-jw-ring-glow"></div>
    <div class="qt-jewelry-animation"></div>
  </div>
</div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js"></script>
<script>
  (function initLottie() {
    if (typeof lottie === "undefined") { setTimeout(initLottie, 100); return; }
    document.querySelectorAll('.qt-jewelry-animation:not(.lottie-init)').forEach(function(el) {
      el.classList.add('lottie-init');
      el.innerHTML = '';
      var anim = lottie.loadAnimation({
        container: el,
        renderer: "svg", loop: true, autoplay: true,
        path: "https://assets10.lottiefiles.com/packages/lf20_jpxs21xg.json"
      });
      var wrapper = el.closest('.qt-jewelry-section');
      if (wrapper) {
        wrapper.addEventListener('mouseenter', function() { anim.setSpeed(1.4); });
        wrapper.addEventListener('mouseleave', function() { anim.setSpeed(0.7); });
      }
    });
  })();
</script>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Jost:wght@300;400;500&display=swap');
  .qt-jewelry-section {
    display: flex; align-items: center; justify-content: space-between; gap: 40px;
    padding: 60px 56px; margin: 24px 0; border-radius: 4px;
    background: #0d0d0d; color: #f0ece4; border: 1px solid #222;
    position: relative; overflow: hidden;
  }
  .qt-jewelry-section::before {
    content:''; position: absolute; inset: 0; pointer-events: none;
    background: radial-gradient(ellipse 60% 80% at 80% 50%, rgba(229,185,92,0.07) 0%, transparent 70%);
  }
  .qt-jewelry-content { flex: 1; position: relative; z-index: 1; }
  .qt-jw-eyebrow {
    display: inline-block; font-family: 'Jost', sans-serif; font-size: .65rem; font-weight: 400;
    letter-spacing: .3em; text-transform: uppercase; color: #e5b95c; margin-bottom: 20px;
    position: relative; padding-left: 28px;
  }
  .qt-jw-eyebrow::before { content:''; position: absolute; left:0; top:50%; width:20px; height:1px; background:#e5b95c; }
  .qt-jewelry-content h3 {
    font-family: 'Cormorant Garamond', serif; font-size: clamp(2.4rem,5vw,3.4rem); font-weight: 300;
    margin: 0 0 20px; color: #f0ece4; line-height: 1.05; letter-spacing: .01em;
  }
  .qt-jewelry-content p { font-family: 'Jost', sans-serif; font-size: .9rem; font-weight: 300; color: #888; margin: 0 0 28px; line-height: 1.7; max-width: 260px; }
  .qt-jw-divider { width: 40px; height: 1px; background: linear-gradient(90deg,#e5b95c,transparent); margin-bottom: 28px; }
  .qt-btn-jewelry {
    display: inline-flex; align-items: center; gap: 10px;
    border: 1px solid rgba(229,185,92,0.5); color: #e5b95c; padding: 12px 28px;
    text-decoration: none; font-family: 'Jost', sans-serif; font-size: .78rem; font-weight: 400;
    letter-spacing: .18em; text-transform: uppercase; transition: all .35s ease; position: relative; overflow: hidden;
  }
  .qt-btn-jewelry::after {
    content:''; position: absolute; inset:0; background:#e5b95c;
    transform: translateX(-101%); transition: transform .35s cubic-bezier(0.65,0,0.35,1); z-index:-1;
  }
  .qt-btn-jewelry:hover { color:#0d0d0d; border-color:#e5b95c; }
  .qt-btn-jewelry:hover::after { transform:translateX(0); }
  .qt-btn-jewelry svg { transition: transform .25s; }
  .qt-btn-jewelry:hover svg { transform: translateX(4px); }
  .qt-jewelry-right { position: relative; flex-shrink:0; width:220px; height:220px; z-index:1; }
  .qt-jewelry-animation {
    width: 220px; height: 220px; position: relative; z-index: 1;
    transition: transform .5s cubic-bezier(0.34,1.56,0.64,1);
    filter: drop-shadow(0 8px 24px rgba(229,185,92,0.25));
  }
  .qt-jewelry-section:hover .qt-jewelry-animation { transform: scale(1.08) rotate(4deg); }
  .qt-jw-ring-glow {
    position: absolute; inset:10%; border-radius:50%;
    background: radial-gradient(circle, rgba(229,185,92,0.25) 0%, transparent 70%);
    filter: blur(16px); animation: qt-glow-pulse 3s ease-in-out infinite; z-index:0;
  }
  @keyframes qt-glow-pulse { 0%,100%{opacity:.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.2)} }
  @media(max-width:640px){.qt-jewelry-section{flex-direction:column;padding:40px 28px;text-align:center}.qt-jw-eyebrow{padding-left:0}.qt-jw-eyebrow::before{display:none}.qt-jewelry-content p{max-width:100%}.qt-jw-divider{margin:0 auto 28px}}
</style>
`;

// ─────────────────────────────────────────────
// 3. giftShopBanner
// ─────────────────────────────────────────────
const giftShopBanner = `
<div class="qt-gift-banner">
  <div class="qt-gift-confetti" aria-hidden="true">
    <span></span><span></span><span></span><span></span><span></span><span></span>
  </div>
  <div class="qt-gift-animation"></div>
  <div class="qt-gift-content">
    <span class="qt-gift-tag">🎁 Free Wrapping Today</span>
    <h3>Perfect Gifts<br>for Loved Ones</h3>
    <p>Find something unforgettable — and we'll wrap it beautifully, on us.</p>
    <a href="#gifts" class="qt-btn-gift">
      <span>Explore Gifts</span>
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M2.5 7.5h10M8.5 3.5l4 4-4 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </a>
  </div>
</div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js"></script>
<script>
  (function initLottie() {
    if (typeof lottie === "undefined") { setTimeout(initLottie, 100); return; }
    document.querySelectorAll('.qt-gift-animation:not(.lottie-init)').forEach(function(el) {
      el.classList.add('lottie-init');
      el.innerHTML = '';
      var anim = lottie.loadAnimation({
        container: el,
        renderer: "svg", loop: true, autoplay: true,
        path: "https://assets4.lottiefiles.com/packages/lf20_pwaeihx8.json"
      });
      var wrapper = el.closest('.qt-gift-banner');
      if (wrapper) {
        wrapper.addEventListener('mouseenter', function(){anim.setSpeed(1.5);});
        wrapper.addEventListener('mouseleave', function(){anim.setSpeed(1);});
      }
    });
  })();
</script>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700&family=Nunito:wght@400;600&display=swap');
  .qt-gift-banner {
    position: relative; display: flex; align-items: center; gap: 28px; padding: 36px 40px; margin: 24px 0;
    background: linear-gradient(135deg,#fff0f3 0%,#fce4ec 50%,#f3e5f5 100%); border-radius: 20px;
    box-shadow: 0 12px 40px rgba(209,73,91,0.15), 0 0 0 1px rgba(209,73,91,0.08); overflow: hidden; isolation: isolate;
  }
  .qt-gift-confetti { position: absolute; inset:0; pointer-events:none; z-index:0; }
  .qt-gift-confetti span { position:absolute; width:8px; height:8px; border-radius:2px; opacity:.25; animation:qt-confetti-float 6s ease-in-out infinite; }
  .qt-gift-confetti span:nth-child(1){background:#d1495b;top:15%;left:8%;animation-delay:0s}
  .qt-gift-confetti span:nth-child(2){background:#9c27b0;top:70%;left:15%;width:6px;height:6px;border-radius:50%;animation-delay:1s}
  .qt-gift-confetti span:nth-child(3){background:#ff9800;top:20%;left:85%;animation-delay:2s}
  .qt-gift-confetti span:nth-child(4){background:#d1495b;top:60%;left:80%;width:10px;height:5px;animation-delay:.5s}
  .qt-gift-confetti span:nth-child(5){background:#e91e63;top:40%;left:92%;width:5px;height:5px;border-radius:50%;animation-delay:1.5s}
  .qt-gift-confetti span:nth-child(6){background:#ff5722;top:80%;left:50%;animation-delay:2.5s}
  @keyframes qt-confetti-float{0%,100%{transform:translateY(0) rotate(0deg);opacity:.2}50%{transform:translateY(-14px) rotate(180deg);opacity:.35}}
  .qt-gift-animation {
    position: relative; z-index:1; flex-shrink:0; width:130px; height:130px;
    filter: drop-shadow(0 6px 18px rgba(209,73,91,0.2));
    transition: transform .4s cubic-bezier(0.34,1.56,0.64,1);
  }
  .qt-gift-banner:hover .qt-gift-animation { transform: scale(1.12) rotate(5deg); }
  .qt-gift-content { position:relative; z-index:1; flex:1; }
  .qt-gift-tag {
    display:inline-block; font-family:'Nunito',sans-serif; font-size:.72rem; font-weight:600; letter-spacing:.04em;
    background:rgba(209,73,91,0.1); color:#b03048; border:1px solid rgba(209,73,91,0.2); border-radius:30px; padding:4px 12px; margin-bottom:12px;
  }
  .qt-gift-content h3 { font-family:'Fraunces',serif; margin:0 0 10px; color:#2a0a12; font-size:clamp(1.5rem,3.5vw,2rem); line-height:1.15; font-weight:700; }
  .qt-gift-content p { font-family:'Nunito',sans-serif; margin:0 0 20px; color:#6b3040; font-size:.9rem; line-height:1.6; }
  .qt-btn-gift {
    display:inline-flex; align-items:center; gap:8px; padding:12px 24px;
    background:linear-gradient(135deg,#d1495b,#b03048); color:#fff; border-radius:50px; text-decoration:none;
    font-family:'Nunito',sans-serif; font-weight:600; font-size:.88rem;
    box-shadow:0 4px 16px rgba(176,48,72,0.35); transition:transform .25s cubic-bezier(0.34,1.56,0.64,1),box-shadow .25s;
  }
  .qt-btn-gift:hover { transform:translateY(-2px) scale(1.04); box-shadow:0 8px 26px rgba(176,48,72,0.5); }
  .qt-btn-gift svg { transition:transform .25s; }
  .qt-btn-gift:hover svg { transform:translateX(3px); }
  @media(max-width:580px){.qt-gift-banner{flex-direction:column;text-align:center;padding:32px 24px}.qt-gift-animation{width:90px;height:90px}}
</style>
`;

const travelDestination = `
<div class="qt-travel-card">
  <div class="qt-travel-scene">
    <div class="qt-travel-animation"></div>
    <div class="qt-travel-gradient"></div>
  </div>
  <div class="qt-travel-content">
    <span class="qt-travel-tag">✈ Featured Destination</span>
    <h3>Santorini,<br>Greece</h3>
    <p>Sun-bleached cliffs, cerulean domes, and sunsets that stop time. Your dream escape awaits.</p>
    <div class="qt-travel-meta">
      <span>🌡 24°C avg</span>
      <span>✈ From $799</span>
      <span>📅 7 nights</span>
    </div>
    <a href="#book-trip" class="qt-btn-travel">Explore Package</a>
  </div>
</div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js"></script>
<script>
  (function initLottie(){
    if (typeof lottie === "undefined") { setTimeout(initLottie, 100); return; }
    document.querySelectorAll('.qt-travel-animation:not(.lottie-init)').forEach(function(el) {
      el.classList.add('lottie-init');
      el.innerHTML = '';
      var anim = lottie.loadAnimation({
        container: el,
        renderer:"svg", loop:true, autoplay:true,
        path:"https://assets9.lottiefiles.com/packages/lf20_jcikwtux.json"
      });
      var wrapper = el.closest('.qt-travel-card');
      if (wrapper) {
        wrapper.addEventListener('mouseenter',function(){anim.setSpeed(1.3);});
        wrapper.addEventListener('mouseleave',function(){anim.setSpeed(0.8);});
      }
    });
  })();
</script>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@700;900&family=Inter:wght@300;400;500&display=swap');
  .qt-travel-card {
    position:relative; display:grid; grid-template-columns:1fr 1fr; margin:24px 0;
    border-radius:20px; overflow:hidden; box-shadow:0 20px 60px rgba(0,0,0,0.3); min-height:360px;
  }
  .qt-travel-scene {
    position:relative; background:linear-gradient(160deg,#0077b6 0%,#00b4d8 40%,#ade8f4 100%); overflow:hidden;
  }
  .qt-travel-animation { position:absolute; inset:0; z-index:1; }
  .qt-travel-gradient {
    position:absolute; inset:0; z-index:2;
    background:linear-gradient(90deg, transparent 60%, rgba(255,251,245,0.9) 100%);
  }
  .qt-travel-content {
    background:#fffbf5; padding:48px 44px; display:flex; flex-direction:column; justify-content:center; position:relative; z-index:1;
  }
  .qt-travel-tag {
    display:inline-block; font-family:'Inter',sans-serif; font-size:.65rem; font-weight:500; letter-spacing:.15em;
    text-transform:uppercase; color:#0077b6; margin-bottom:16px;
  }
  .qt-travel-content h3 {
    font-family:'Unbounded',sans-serif; font-size:clamp(1.6rem,3.5vw,2.4rem); font-weight:900;
    margin:0 0 14px; color:#111; line-height:1.1;
  }
  .qt-travel-content p { font-family:'Inter',sans-serif; font-weight:300; margin:0 0 20px; color:#555; font-size:.88rem; line-height:1.7; }
  .qt-travel-meta { display:flex; flex-direction:column; gap:6px; margin-bottom:24px; }
  .qt-travel-meta span { font-family:'Inter',sans-serif; font-size:.8rem; color:#444; font-weight:400; }
  .qt-btn-travel {
    display:inline-block; padding:13px 28px; background:#0077b6; color:#fff; text-decoration:none;
    font-family:'Inter',sans-serif; font-size:.82rem; font-weight:500; border-radius:8px;
    box-shadow:0 4px 16px rgba(0,119,182,0.35); transition:transform .25s cubic-bezier(0.34,1.56,0.64,1),box-shadow .25s,background .25s; width:fit-content;
  }
  .qt-btn-travel:hover { background:#005f92; transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,119,182,0.5); }
  @media(max-width:640px){.qt-travel-card{grid-template-columns:1fr}.qt-travel-scene{height:220px}.qt-travel-gradient{background:linear-gradient(180deg,transparent 60%,rgba(255,251,245,0.95) 100%)}.qt-travel-content{padding:36px 28px}}
</style>
`;

export const customCodeTemplates = {
	ctaSection,
	jewelryCollection,
	giftShopBanner,
	travelDestination,
};
