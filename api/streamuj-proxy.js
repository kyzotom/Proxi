const axios = require("axios");

module.exports = async (req, res) => {
    const pseudoUrl = req.query.pseudoUrl;
    // Prednosť má cookie z query, inak z env
    const cookie = req.query.cookie || process.env.STREAMUJ_COOKIE || "";

    if (!pseudoUrl) return res.status(400).json({ error: "pseudoUrl missing" });

    try {
        const headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "*/*"
        };
        if (cookie) headers["Cookie"] = cookie;

        const response = await axios.get(pseudoUrl, { headers });
        // Skús extrahovať mp4 z body (aj fallback)
        const match = typeof response.data === "string" && response.data.match(/https?:\/\/[^\s"']+\.mp4[^\s"']*/);
        const url = match ? match[0] : null;
        if (url) return res.json({ url });

        return res.status(404).json({ error: "No mp4 found in body" });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};
