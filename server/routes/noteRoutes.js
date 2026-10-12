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
} = require("../controllers/noteController");
const { addComment } = require("../controllers/commentController");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

router.get("/mine/all", protect, getMyNotes);

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
router.post("/:id/comments", protect, addComment);

module.exports = router;