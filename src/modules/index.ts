import express from 'express'
import type { Express } from 'express'

import cookieParser from "cookie-parser";
import { anonRole } from 'drizzle-orm/supabase';

// import { authRouter } from './auth/auth.routes'
// import { router as oidcRouter } from './auth/oidc.routes'


export function createExpressApplication(): Express {
    const app = express()


    app.use(express.json())
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());

    app.get('/health', (req, res) => {
        res.status(200).json({ status: 'ok' })
    })

    app.get("/", (req, res) => {
        res.send(`
      <html></html>
        <body>
          <h1>Welcome to the OIDC Client App</h1>
            <a href="http://localhost:6001/api/v1/auth/authorize?client_id=project1&redirect_uri=http://localhost:3001/callback&state=xyz">Login with OIDC</a>
`)
    })

    app.get('/callback', async (req, res) => {
        try {
            // ✅ Correct way
            const code = req.query.code as string

            if (!code) {
                return res.status(400).send('Missing code')
            }

            // ✅ Exchange code → token
            const result = await fetch('http://oidc_app:6001/api/v1/auth/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code,
                    client_id: 'project1',
                    client_secret: 'secret123',
                }),
            })

            console.log(result)

            // If the token endpoint returned a non-2xx status, log body and return error
            const contentType = result.headers.get('content-type') || ''

            if (!result.ok) {
                const text = await result.text().catch(() => '<unable to read body>')
                console.error('Token endpoint returned error', result.status, text)
                return res.status(502).send('Token exchange failed')
            }

            // If content-type is not JSON, capture and log the body to help debugging
            if (!contentType.includes('application/json')) {
                const text = await result.text().catch(() => '<unable to read body>')
                console.error('Token endpoint returned non-JSON response:', text)
                return res.status(502).send('Token exchange returned non-JSON')
            }

            const data: any = await result.json()

            if (!data) {
                return res.status(400).send('Missing token response')
            }

            console.log('TOKEN RESPONSE:', data)

            res.send(`<html>
        <body>
          <h2>Login Success</h2>
          <p>Access Token: ${data.access_token as String}</p>
          <p>ID Token: ${data.id_token as String}</p>
        </body>
      </html>
    `)
        } catch (err) {
            console.error(err)
            res.status(500).send('Something went wrong')
        }
    })

    app.get('/refresh-test', async (req, res) => {
        const result = await fetch('http://oidc_app:6001/api/v1/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                refreshToken: '24aeef3b-098c-45e4-94fb-86c38f360bc1'
            })
        })

        const data = await result.json()

        res.send(`
    <h2>Refresh Result</h2>
    <pre>${JSON.stringify(data, null, 2)}</pre>
  `)
    })



    // app.use(oidcRouter)
    // app.use('/api/v1/auth', authRouter)

    return app
}