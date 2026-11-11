/* Optional self-host settings. Leave the endpoints empty for the static app.
   window.PINPOINT_CONFIG = {
     AI_ENDPOINT: 'https://your-proxy.example/deck',
     API_BASE: 'https://your-proxy.example'
   };
   Also add that origin to connect-src in index.html. Never put API keys here. */
window.PINPOINT_CONFIG = window.PINPOINT_CONFIG || { AI_ENDPOINT: '', API_BASE: '' };
