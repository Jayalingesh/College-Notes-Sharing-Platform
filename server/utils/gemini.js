const { httpError } = require("./extractText");

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_MODEL = "gemini-3.5-flash-lite"; // override with GEMINI_MODEL in .env
const TIMEOUT_MS = 60000;

const parseJson = (raw) => {
    const cleaned = raw
        .trim()
        .replace(/^```(?:json)?/i, "")
        .replace(/```$/, "")
        .trim();
    return JSON.parse(cleaned);
};

// Sends a prompt (plus an optional file) to Gemini and returns parsed JSON.
const generateJson = async ({ prompt, inline }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if(!apiKey) {
        throw httpError(503, "AI tools are not set up yet (GEMINI_API_KEY is missing on the server)");
    }

    const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
    const parts = [{ text: prompt }];
    if(inline) parts.push({ inline_data: inline });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let res;
    try {
        res = await fetch(`${API_BASE}/${model}:generateContent`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": apiKey,
            },
            body: JSON.stringify({
                contents: [{ role: "user", parts }],
                generationConfig: {
                    responseMimeType: "application/json",
                    temperature: 0.4,
                },
            }),
            signal: controller.signal,
        });
    } catch(err) {
        if(err.name === "AbortError") throw httpError(504, "The AI took too long to respond. Please try again");
        throw httpError(502, "Could not reach the AI service");
    } finally {
        clearTimeout(timer);
    }

    if(!res.ok) {
        const body = await res.text().catch(() => "");
        console.error(`Gemini API error ${res.status}:`, body.slice(0, 500));
        if(res.status === 429) throw httpError(429, "AI is busy right now (free quota reached). Please try again in a minute");
        if(res.status === 404) throw httpError(502, "AI model not found. Set a valid GEMINI_MODEL on the server");
        if(res.status === 400 || res.status === 403) throw httpError(502, "AI request was rejected. Check GEMINI_API_KEY and GEMINI_MODEL on the server");
        throw httpError(502, "The AI service had a problem. Please try again");
    }

    const data = await res.json();
    const text = (data?.candidates?.[0]?.content?.parts || [])
        .filter((p) => !p.thought)
        .map((p) => p.text || "")
        .join("");

    if(!text) {
        const reason = data?.promptFeedback?.blockReason;
        throw httpError(502, reason ? "The AI could not process this note" : "The AI returned an empty answer");
    }

    try {
        return parseJson(text);
    } catch {
        throw httpError(502, "The AI answer was not in the expected format. Please try again");
    }
};

module.exports = { generateJson };
