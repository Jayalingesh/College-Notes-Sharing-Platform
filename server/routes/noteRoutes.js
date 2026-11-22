const express = require("express");
const {
    createNote,
    getNotes,
    getNoteById,
    updateNote,
    deleteNote,
    downloadNote,
    toggleLike,
    toggleBookmark,
    getMyNotes,
    toggleVerify,
    getReviewNotes,
} = require("../controllers/noteController");
const { addComment } = require("../controllers/commentController");
const { getAiStudy, generateSummary, generateQuiz } = require("../controllers/aiController");
const { protect, adminOnly } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

router.get("/mine/all", protect, getMyNotes);
router.get("/review/all", protect, adminOnly, getReviewNotes);

router
    .route("/")
    .get(getNotes)
    .post(protect, upload.single("file"), createNote);

router
    .route("/:id")
    .get(getNoteById)
    .put(protect, updateNote)
    .delete(protect, deleteNote);

router.get("/:id/download", downloadNote);
router.put("/:id/like", protect, toggleLike);
router.put("/:id/bookmark", protect, toggleBookmark);
router.put("/:id/verify", protect, adminOnly, toggleVerify);
router.get("/:id/ai", getAiStudy);
router.post("/:id/ai/summary", protect, generateSummary);
router.post("/:id/ai/quiz", protect, generateQuiz);
router.post("/:id/comments", protect, addComment);

module.exports = router;