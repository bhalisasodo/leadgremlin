/**
 * LeadGremlin Production & Development API Configuration
 * Centralized API base URL resolver for static frontend (GitHub Pages) & local Express backend.
 */
(function (window) {
  // Configurable Render backend URL (e.g. https://leadgremlin.onrender.com)
  const DEFAULT_RENDER_API_URL = 'https://leadgremlin.onrender.com';

  window.LEADGREMLIN_CONFIG = {
    // Override this URL if your Render service URL differs
    PRODUCTION_API_URL: DEFAULT_RENDER_API_URL,

    /**
     * Resolves API Base URL dynamically depending on current environment
     */
    getApiBaseUrl: function () {
      // 1. Explicit developer override via window or localStorage
      if (window.API_BASE_URL) return window.API_BASE_URL.replace(/\/+$/, '');
      if (typeof localStorage !== 'undefined' && localStorage.getItem('LEADGREMLIN_API_URL')) {
        return localStorage.getItem('LEADGREMLIN_API_URL').replace(/\/+$/, '');
      }

      const host = window.location.hostname;
      const port = window.location.port;

      // 2. Local development environment (Express server or local file)
      if (host === 'localhost' || host === '127.0.0.1' || window.location.protocol === 'file:') {
        if (port && port !== '80' && port !== '443') {
          return `${window.location.protocol}//${host}:${port}`;
        }
        return 'http://localhost:3005';
      }

      // 3. Production static deployment (GitHub Pages: bhalisasodo.github.io)
      return this.PRODUCTION_API_URL.replace(/\/+$/, '');
    },

    /**
     * Formats full API URL for a given path
     */
    apiUrl: function (path) {
      const base = this.getApiBaseUrl();
      const cleanPath = path.startsWith('/') ? path : '/' + path;
      return base + cleanPath;
    }
  };

  console.log(`⚡ LeadGremlin API Client initialized -> Target Backend: ${window.LEADGREMLIN_CONFIG.getApiBaseUrl()}`);
})(window);
