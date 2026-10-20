// Start the existing entrance as soon as HTML and CSS are ready. Project
// initialisation and its dependencies do not gate the opening content.
(() => {
  requestAnimationFrame(() => {
    document.body.classList.remove("is-loading");
    document.body.classList.add("is-loaded");
    performance.mark("portfolio-hero-start");
    window.dispatchEvent(new Event("portfolio:hero-ready"));
  });
})();
