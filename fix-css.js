const fs = require('fs');
let css = fs.readFileSync('app/globals.css', 'utf8');

// find the start of the previous responsive block and trim it
const idx = css.indexOf('@media (max-width: 1024px)');
if (idx !== -1) {
  css = css.substring(0, idx);
}

// remove all block comments from the entire CSS to be absolutely sure CSSNano doesn't choke on malformed comments
css = css.replace(/\/\*[\s\S]*?\*\//g, '');

const responsive = `
@media (max-width: 1024px) {
  .app-container {
    flex-direction: column !important;
  }
  .sidebar {
    width: 100% !important;
    height: auto !important;
    min-height: auto !important;
    position: relative !important;
    flex-direction: row !important;
    overflow-x: auto !important;
    padding: 0.5rem !important;
    border-right: none !important;
    border-bottom: 1px solid var(--color-card-border) !important;
  }
  .sidebar-nav ul {
    flex-direction: row !important;
    gap: 1rem !important;
  }
  .sidebar-nav li {
    flex-shrink: 0;
  }
  .nav-text {
    display: none !important;
  }
  .sidebar-footer {
    display: none !important;
  }
  .sidebar-toggle-btn {
    display: none !important;
  }
  .main-content {
    height: auto !important;
    min-height: calc(100vh - var(--header-height) - 60px) !important;
  }
}

@media (max-width: 768px) {
  .header {
    flex-wrap: wrap !important;
    height: auto !important;
    min-height: var(--header-height);
    padding: 1rem !important;
  }
  .header-center {
    order: 3;
    width: 100% !important;
    margin-top: 1rem !important;
  }
  .header-center .search-bar {
    width: 100% !important;
    max-width: 100% !important;
  }
  section.screen {
    padding: 1rem !important;
  }
  table {
    min-width: 600px !important;
  }
  .app-footer {
    flex-wrap: wrap !important;
    height: auto !important;
    padding: 1rem !important;
    gap: 1rem !important;
    justify-content: center !important;
  }
  .footer-left, .footer-center, .footer-right {
    width: 100% !important;
    justify-content: center !important;
    text-align: center !important;
  }
}

@media (max-width: 480px) {
  .logo-text h1 {
    font-size: 1.1rem !important;
  }
  .icon-btn {
    width: 32px !important;
    height: 32px !important;
  }
}
`;

fs.writeFileSync('app/globals.css', css + '\n' + responsive);
console.log('Fixed CSS');
