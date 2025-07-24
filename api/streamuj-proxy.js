const axios = require("axios");

module.exports = async (req, res) => {
    const pseudoUrl = req.query.pseudoUrl;
    // Cookie môžeš zadať cez query alebo ENV
    const cookie = req.query.cookie || process.env.STREAMUJ_COOKIE || "";

    if (!pseudoUrl) return res.status(400).json({ error: "pseudoUrl missing" });

    try {
        // HEADERS pre maximálnu šancu na success
        const headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "*/*",
            "Referer": "https://movies.sosac2.tv/"
        };
        if (cookie) headers["Cookie"] = cookie;

        // 1. Skús načítať pseudoUrl (čakáme mp4 v texte alebo priamy redirect)
        const response = await axios.get(pseudoUrl, { headers, maxRedirects: 5, validateStatus: null });

        // Fallback na redirect v HEADERS (ak response.status je 302/301/303)
        if ([301, 302, 303].includes(response.status) && response.headers.location) {
            return res.json({ url: response.headers.location });
        }

        // 2. Skús vyparsovať mp4 link z textu (najčastejší prípad)
        if (typeof response.data === "string" && response.data.includes(".mp4")) {
            const match = response.data.match(/https?:\/\/[^\s"']+\.mp4[^\s"']*/);
            if (match && match[0]) return res.json({ url: match[0] });
        }

        // 3. Ak nič, vypíš logy pre debug
        return res.status(404).json({
            error: "No mp4 found in body or redirect.",
            response: {
                status: response.status,
                headers: response.headers,
                length: typeof response.data === "string" ? response.data.length : undefined
            }
        });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};
