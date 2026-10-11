import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Load .env.local and .env into process.env for local serverless functions
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Vite plugin that executes TypeScript serverless API routes in /api locally,
 * providing 100% parity with Vercel Serverless Functions in development.
 */
function localApiServerlessPlugin(): Plugin {
  return {
    name: 'local-api-serverless-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const urlPath = req.url?.split('?')[0] || '';

        if (!urlPath.startsWith('/api/')) {
          return next();
        }

        // Map /api/xyz -> <root>/api/xyz.ts
        const routeName = urlPath.replace(/^\/api\//, '');
        const apiFilePath = path.resolve(__dirname, 'api', `${routeName}.ts`);

        if (!fs.existsSync(apiFilePath)) {
          return next();
        }

        try {
          // Load TypeScript module dynamically via Vite SSR engine
          const module = await server.ssrLoadModule(apiFilePath);
          const handler = module.default;

          if (typeof handler !== 'function') {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: `API route ${routeName} does not export a default function.` }));
            return;
          }

          // Buffer request body if present
          const chunks: Buffer[] = [];
          for await (const chunk of req) {
            chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
          }
          const rawBody = Buffer.concat(chunks).toString('utf-8');
          let parsedBody: any = undefined;
          if (rawBody) {
            try {
              parsedBody = JSON.parse(rawBody);
            } catch {
              parsedBody = rawBody;
            }
          }

          // Mock Vercel response helper methods
          let statusCode = 200;
          const mockRes: any = res;
          mockRes.status = function (code: number) {
            statusCode = code;
            res.statusCode = code;
            return mockRes;
          };
          mockRes.json = function (data: any) {
            res.statusCode = statusCode;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
          };

          const mockReq: any = req;
          mockReq.body = parsedBody;
          mockReq.query = Object.fromEntries(new URLSearchParams(req.url?.split('?')[1] || ''));

          await handler(mockReq, mockRes);
        } catch (error: any) {
          console.error(`[API Error] ${urlPath}:`, error);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              error: 'Internal Server Error in local API handler',
              details: error?.message || String(error)
            }));
          }
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [
    react(),
    localApiServerlessPlugin(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@api': path.resolve(__dirname, './api'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  // @ts-expect-error Vitest config is compatible with Vite defineConfig
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
