// Mock import.meta for Jest
// This needs to be done before any modules are imported
if (!globalThis.import) {
  Object.defineProperty(globalThis, 'import', {
    value: {
      meta: {
        env: {
          USE_OPENAI: process.env.USE_OPENAI || 'false',
          VITE_OPENAI_API_KEY: process.env.VITE_OPENAI_API_KEY || '',
          VITE_GEMINI_API_KEY: process.env.VITE_GEMINI_API_KEY || '',
        },
      },
    },
    writable: true,
    configurable: true,
  });
} else if (!globalThis.import.meta) {
  globalThis.import.meta = {
    env: {
      USE_OPENAI: process.env.USE_OPENAI || 'false',
      VITE_OPENAI_API_KEY: process.env.VITE_OPENAI_API_KEY || '',
      VITE_GEMINI_API_KEY: process.env.VITE_GEMINI_API_KEY || '',
    },
  };
} else if (!globalThis.import.meta.env) {
  globalThis.import.meta.env = {
    USE_OPENAI: process.env.USE_OPENAI || 'false',
    VITE_OPENAI_API_KEY: process.env.VITE_OPENAI_API_KEY || '',
    VITE_GEMINI_API_KEY: process.env.VITE_GEMINI_API_KEY || '',
  };
}

