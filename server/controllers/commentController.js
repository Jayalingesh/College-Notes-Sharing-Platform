const asyncHandler = require("express-async-handler");
const Comment = require("../models/Comment");
const Note = require("../models/Note");

// @desc Add a comment to a note
// @route POST /api/notes/:id/comments
// @access Private

const addComment = asyncHandler(async (req, res) =>{
    const { text } = req.body;

    if(!text || !text.trim()){
        res.status(400);
        throw new Error("Comment text is required");
    }

    const note = await Note.findById(req.params.id);
    if(!note) {
        res.status(404);
        throw new Error("Note not found");
    }

    const comment = await Comment.create({
        note: note._id,
        user: req.user._id,
        text: text.trim(),
    });

    const populated = await comment.populate("user", "name avatarInitial");

    res.status(201).json({ success: true, comment: populated });
});

// @desc Delete a comment (owner or admin only)
// @route DELETE /api/comments/:commentId
// @access Private

const deleteComment = asyncHandler(async (req, res) => {
    const comment = await Comment.findById(req.params.commentId);

    if(!comment) {
        res.status(404);
        throw new Error("Comment not found");
    }

    if(comment.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
        res.status(403);
        throw new Error("Not authorized to delete this comment");
    }

    await comment.deleteOne();
    res.json({ success: true, message: "Comment deleted" });
});

module.exports = { addComment, deleteComment };