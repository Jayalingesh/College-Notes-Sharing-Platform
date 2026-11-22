const asyncHandler = require("express-async-handler");
const Note = require("../models/Note");
const { extractNoteContent, httpError } = require("../utils/extractText");
const { makeSummary, makeQuiz } = require("../utils/studyAi");

// ---- simple protection for the free AI quota ----
const HOURLY_LIMIT = 10; // generations per user per hour
const usage = new Map(); // userId -> [timestamps]
const inFlight = new Set(); // "noteId:kind" being generated right now

const checkRateLimit = (userId) => {
    const now = Date.now();
    const recent = (usage.get(userId) || []).filter((t) => now - t < 60 * 60 * 1000);
    if(recent.length >= HOURLY_LIMIT) {
        throw httpError(429, "You have reached the hourly limit for AI generation. Please try again later");
    }
    recent.push(now);
    usage.set(userId, recent);
};

const hasContent = (obj) => (obj && obj.generatedAt ? obj : null);

// @desc Get saved AI summary and quiz for a note (if already generated)
// @route GET /api/notes/:id/ai
// @access Public
const getAiStudy = asyncHandler(async (req, res) => {
    const note = await Note.findById(req.params.id).select("+aiSummary +aiQuiz");

    if(!note) {
        res.status(404);
        throw new Error("Note not found");
    }

    res.json({
        success: true,
        summary: hasContent(note.aiSummary),
        quiz: hasContent(note.aiQuiz),
    });
});

const generate = (kind) =>
    asyncHandler(async (req, res) => {
        const note = await Note.findById(req.params.id).select("+aiSummary +aiQuiz");

        if(!note) {
            res.status(404);
            throw new Error("Note not found");
        }

        const field = kind === "summary" ? "aiSummary" : "aiQuiz";
        const saved = hasContent(note[field]);

        const canRefresh =
            note.uploadedBy.toString() === req.user._id.toString() || req.user.role === "admin";
        const refresh = req.body?.refresh === true && canRefresh;

        // Already generated once: everybody reuses it (saves quota and time)
        if(saved && !refresh) {
            return res.json({ success: true, cached: true, [kind]: saved });
        }

        const key = `${note._id}:${kind}`;
        if(inFlight.has(key)) {
            res.status(409);
            throw new Error("This is already being generated. Please wait a few seconds and refresh");
        }

        try {
            checkRateLimit(req.user._id.toString());
            inFlight.add(key);

            const content = await extractNoteContent(note);
            const result = kind === "summary" ? await makeSummary(note, content) : await makeQuiz(note, content);
            const doc = { ...result, generatedAt: new Date() };

            await Note.updateOne({ _id: note._id }, { $set: { [field]: doc } });

            res.json({ success: true, cached: false, [kind]: doc });
        } catch(err) {
            res.status(err.status || 500);
            throw err;
        } finally {
            inFlight.delete(key);
        }
    });

module.exports = {
    getAiStudy,
    generateSummary: generate("summary"),
    generateQuiz: generate("quiz"),
};
