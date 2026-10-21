const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

const PORT = process.env.PORT || 8080;

app.use(cors());

app.get('/gateway', async (req, res) => {
    let targetUrl = req.query.url;
    if (!targetUrl) {
        return res.status(400).send('Error: Missing target url query parameter.');
    }

    try {
        const response = await axios.get(targetUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
            responseType: 'text'
        });

        let htmlContent = response.data;
        
        const urlObj = new URL(targetUrl);
        const originUrl = urlObj.origin;

        const baseTag = `<head><base href="${originUrl}/">`;
        htmlContent = htmlContent.replace('<head>', baseTag);

        res.removeHeader('X-Frame-Options');
        res.removeHeader('Content-Security-Policy');
        
        res.send(htmlContent);
    } catch (error) {
        res.status(500).send(`Gateway connection timeout mapping: ${error.message}`);
    }
});

app.listen(PORT, () => {
    console.log(`Server streaming engine running smoothly on port: ${PORT}`);
});
