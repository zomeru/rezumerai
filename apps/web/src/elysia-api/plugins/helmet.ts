const docsDevScriptSrc = ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net"];

const docsDevStyleSrc = ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"];

const docsDevConnectSrc = ["'self'", "https://proxy.scalar.com", "https://api.scalar.com"];

export function createApiHelmetConfig({ isDev }: { isDev: boolean }) {
  if (isDev) {
    return {
      csp: {
        scriptSrc: docsDevScriptSrc,
        styleSrc: docsDevStyleSrc,
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        connectSrc: docsDevConnectSrc,
        imgSrc: ["'self'", "data:", "https:"],
        objectSrc: ["'none'"],
      },
    };
  }

  return {
    csp: {
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      fontSrc: ["'self'"],
      connectSrc: ["'self'"],
      imgSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
    },
  };
}
