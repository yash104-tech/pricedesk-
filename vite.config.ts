import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'fs'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'firebase-admin-helper',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/api/generate-reset-link' && req.method === 'POST') {
            let body = ''
            req.on('data', (chunk) => {
              body += chunk
            })
            req.on('end', async () => {
              try {
                const { email } = JSON.parse(body)
                if (!email) {
                  res.statusCode = 400
                  res.end(JSON.stringify({ error: 'Email is required' }))
                  return
                }

                // Dynamically import firebase-admin to avoid bringing it into browser bundle
                const admin = (await import('firebase-admin')).default

                const keyPath = path.resolve('./serviceAccountKey.json')
                if (!fs.existsSync(keyPath)) {
                  res.statusCode = 400
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({ error: 'serviceAccountKey.json missing' }))
                  return
                }

                if (admin.apps.length === 0) {
                  const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'))
                  admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                  })
                }

                const resetUrl = process.env.RESET_URL || `http://localhost:5173/login`
                const link = await admin.auth().generatePasswordResetLink(email, { url: resetUrl })

                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ link }))
              } catch (err: any) {
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: err.message || 'Internal server error' }))
              }
            })
          } else {
            next()
          }
        })
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
