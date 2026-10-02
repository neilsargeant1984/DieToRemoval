import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'

function arenaLogPlugin(): Plugin {
  return {
    name: 'arena-log-middleware',
    configureServer(server) {
      server.middlewares.use('/api/arena-log', (_req, res) => {
        const userProfile = process.env.USERPROFILE || process.env.HOME || '';
        const logPath = path.join(userProfile, 'AppData', 'LocalLow', 'Wizards Of The Coast', 'MTGA', 'Player.log');
        if (fs.existsSync(logPath)) {
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          fs.createReadStream(logPath).pipe(res);
        } else {
          res.statusCode = 404;
          res.end('Player.log not found');
        }
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    arenaLogPlugin(),
  ],
})


