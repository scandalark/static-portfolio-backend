const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();

const PORT = process.env.PORT || 8080;

app.use(cors({
    origin: '*',
    credentials: true
}));

app.use('/gateway', (req, res, next) => {
    const targetUrl = req.query.url;
    if (!targetUrl) {
        return res.status(400).send('Error: Missing target web url query parameter.');
    }

    let parsedTarget;
    try {
        parsedTarget = new URL(targetUrl);
    } catch (e) {
        return res.status(400).send('Error: Invalid URL string structure configuration.');
    }

    createProxyMiddleware({
        target: parsedTarget.origin,
        changeOrigin: true,
        followRedirects: true,
        pathRewrite: () => parsedTarget.pathname + parsedTarget.search,
        on: {
            proxyReq: (proxyReq, req, res) => {
                proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
                proxyReq.setHeader('Accept-Language', 'en-US,en;q=0.9');
                proxyReq.setHeader('Referer', parsedTarget.origin);
            },
            proxyRes: (proxyRes, req, res) => {
                delete proxyRes.headers['x-frame-options'];
                delete proxyRes.headers['content-security-policy'];
                delete proxyRes.headers['content-security-policy-report-only'];

                proxyRes.headers['Access-Control-Allow-Origin'] = '*';
                proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';

                if (proxyRes.headers['set-cookie']) {
                    proxyRes.headers['set-cookie'] = proxyRes.headers['set-cookie'].map(cookie => {
                        return cookie.replace(/SameSite=Lax/gi, 'SameSite=None; Secure')
                                     .replace(/SameSite=Strict/gi, 'SameSite=None; Secure');
                    });
                }
            }
        }
    })(req, res, next);
});

app.listen(PORT, () => {
    console.log(`Advanced secure bypass proxy active on system port: ${PORT}`);
});
