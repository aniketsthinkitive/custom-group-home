import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// ⬇️ GitHub Pages base path. For a PROJECT site served at
//    https://<user>.github.io/<repo>/  set this to '/<repo>/'.
//    For a USER/ORG site (https://<user>.github.io) use '/'.
//    Change "custom-group-home" to your actual GitHub repository name.
const GITHUB_PAGES_BASE = '/custom-group-home/'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    // Use the repo base only for production builds; keep dev server at '/'.
    base: mode === 'production' ? GITHUB_PAGES_BASE : '/',
    plugins: [react()],
    build: {
      outDir: "dist",
      assetsDir: "assets",
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: {
        "/api": {
          target: env.VITE_API_BASE_URL || "http://127.0.0.1:8000",
          changeOrigin: true,
          secure: false,
          // Rewrite cookies to work with same-origin requests
          cookieDomainRewrite: {
            "127.0.0.1": "localhost", // Rewrite 127.0.0.1 cookies to localhost
            "*": "", // Remove domain for other cookies (same-origin)
          },
          cookiePathRewrite: {
            "*": "/", // Ensure cookie path is /
          },
          configure: (proxy, _options) => {
            proxy.on("proxyReq", (proxyReq, req, _res) => {
              // Forward cookies
              if (req.headers.cookie) {
                proxyReq.setHeader("Cookie", req.headers.cookie);
              }
            });
            proxy.on("proxyRes", (proxyRes) => {
              // Rewrite Set-Cookie headers to work with localhost
              const setCookieHeaders = proxyRes.headers["set-cookie"];
              if (setCookieHeaders) {
                proxyRes.headers["set-cookie"] = setCookieHeaders.map(
                  (cookie) => {
                    // Replace domain=127.0.0.1 with domain=localhost or remove domain
                    return cookie
                      .replace(/domain=127\.0\.0\.1/gi, "domain=localhost")
                      .replace(/domain=[^;]+/gi, ""); // Remove other domain settings for same-origin
                  }
                );
              }
            });
          },
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/__tests__/setup.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: [
          'node_modules/',
          'src/__tests__/',
          '**/*.d.ts',
          '**/*.config.*',
          '**/mockData',
        ],
      },
    },
  };
})
