const asyncHandler = require("express-async-handler");
const fs = require("fs");
const path = require("path");
const Note = require("../models/Note");
const User = require("../models/User");
const Comment = require("../models/Comment");
const { saveFile, findFile, openDownloadStream, deleteFile } = require("../utils/gridfs");

// @desc Upload a new note
// @route POST /api/notes
// @access Private

const createNote = asyncHandler(async (req, res) => {
    const { title, description, subject, branch, semester, tags } = req.body;

    if(!req.file){
        res.status(400);
        throw new Error("Please attach a file");
    }

    if(!title || !subject || !branch || !semester) {
        res.status(400);
        throw new Error("Title, subject, branch and semester are required");
    }

    const fileId = await saveFile(req.file);

    let note;
    try {
        note = await Note.create({
            title,
            description,
            subject,
            branch,
            semester,
            tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
            fileId,
            fileName: req.file.originalname,
            fileType: req.file.mimetype,
            fileSize: req.file.size,
            uploadedBy: req.user._id,
        });
    } catch (err) {
        await deleteFile(fileId); // don't leave an orphan file behind
        throw err;
    }

    const populated = await note.populate("uploadedBy", "name college");

    res.status(201).json({ success: true, note: populated });
});

// @desc Get all notes with filters, search, pagination
// @route GET /api/notes
// @access Public

const getNotes = asyncHandler(async (req, res) => {
    const { search, branch, semester, subject, sort, page = 1, limit = 12 } = req.query;

    const query = {};

    if(search) {
        query.$text = { $search: search };
    }

    if(branch) query.branch = branch;
    if(semester) query.semester = semester;
    if(subject) query.subject = subject;
    
    let sortOption = { createdAt: -1 };
    if(sort === "popular") sortOption = { downloads: -1 };
    if(sort === "liked") sortOption = { "likes.length": -1 };
    if(sort === "oldest") sortOption = { createdAt: 1 };

    const skip = (Number(page) - 1) * Number(limit);

    const [notes, total] = await Promise.all([
        Note.find(query)
            .populate("uploadedBy", "name college")
            .sort(sortOption)
            .skip(skip)
            .limit(Number(limit)),
        Note.countDocuments(query),
    ]);

    res.json({
        success: true,
        notes,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalResults: total,
    });
});

// @desc Get single note by id
// @route GET /api/notes/:id
// @access Public

const getNoteById = asyncHandler(async (req, res) => {
    const note = await Note.findById(req.params.id).populate("uploadedBy", "name college branch");

    if(!note) {
        res.status(404);
        throw new Error("Note not found");
    }

    const comments = await Comment.find({ note: note._id })
        .populate("user", "name avatarInitial")
        .sort({ createdAt: -1 });

    res.json({ success: true, note, comments });
});

// @desc Update note metadata (owner only)
// @route PUT /api/notes/:id
// @access Private

const updateNote = asyncHandler(async (req, res) => {
    const note = await Note.findById(req.params.id);

    if(!note){
        res.status(404);
        throw new Error("Note not found");
    }

    if(note.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== "admin"){
        res.status(403);
        throw new Error("Not authorized to edit this note");
    }

    const { title, description, subject, branch, semester, tags } = req.body;

    note.title = title ?? note.title;
    note.description = description ?? note.description;
    note.subject = subject ?? note.subject;
    note.branch = branch ?? note.branch;
    note.semester = semester ?? note.semester;

    if(tags) note.tags = tags.split(",").map((t) => t.trim()).filter(Boolean);

    const updated = await note.save();
    res.json({ success: true, note: updated });
});

// #desc Delete a note (owner or admin only)
// @route DELETE /api/notes/:id
// @access Private

const deleteNote = asyncHandler(async (req, res) => {
    const note = await Note.findById(req.params.id);

    if(!note){
        res.status(404);
        throw new Error("Note not found");
    }

    if(note.uploadedBy.toString() !== req.user.id.toString() && req.user.role !== "admin"){
        res.status(403);
        throw new Error("Not authorized to delete this note");
    }

    if(note.fileId){
        await deleteFile(note.fileId);
    } else if(note.fileUrl){
        // notes uploaded before the move to GridFS
        fs.unlink(path.join(__dirname, "..", note.fileUrl), () => {});
    }

    await Comment.deleteMany({ note: note._id });
    await note.deleteOne();

    res.json({ success: true, message: "Note deleted successfully" });
});

// @desc Track a download (increments counter, returns file path)
// @route GET /api/notes/:id/download
// @access Public

const downloadNote = asyncHandler(async (req, res, next) => {
    const note = await Note.findById(req.params.id);

    if(!note) {
        res.status(404);
        throw new Error("Note not found");
    }

    const missingMessage = "File missing on server. Please ask the uploader to upload it again.";

    // Notes stored in MongoDB (GridFS)
    if(note.fileId){
        const file = await findFile(note.fileId);
        if(!file){
            res.status(404);
            throw new Error(missingMessage);
        }

        await Note.updateOne({ _id: note._id }, { $inc: { downloads: 1 } });

        const asciiName = note.fileName.replace(/[^\x20-\x7E]/g, "_").replace(/"/g, "'");
        res.set({
            "Content-Type": note.fileType || "application/octet-stream",
            "Content-Length": file.length,
            "Content-Disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(note.fileName)}`,
        });

        const stream = openDownloadStream(note.fileId);
        stream.on("error", (err) => {
            if(!res.headersSent) return next(err);
            res.destroy(err);
        });
        return stream.pipe(res);
    }

    // Legacy notes stored on the server disk
    const filePath = note.fileUrl ? path.join(__dirname, "..", note.fileUrl) : null;
    if(!filePath || !fs.existsSync(filePath)){
        res.status(404);
        throw new Error(missingMessage);
    }

    await Note.updateOne({ _id: note._id }, { $inc: { downloads: 1 } });
    res.download(filePath, note.fileName);
});

// @desc Toggle like on a note
// @route PUT /api/notes/:id/like
// @access Private

const toggleLike = asyncHandler(async (req, res) => {
    const note = await Note.findById(req.params.id);

    if(!note) {
        res.status(404);
        throw new Error("Note not found");
    }

    const userId = req.user._id.toString();
    const alreadyLiked = note.likes.some((id) => id.toString() === userId);

    if(alreadyLiked) {
        note.likes = note.likes.filter((id) => id.toString() !== userId);
    } else {
        note.likes.push(req.user._id);
    }

    await note.save();

    res.json({ success: true, likesCount: note.likes.length, liked: !alreadyLiked });
});

// @desc Toggle bookmark on a note
// @route PUT /api/notes/:id/bookmark
// @access Private

const toggleBookmark = asyncHandler(async (req, res) => {
    const note = await Note.findById(req.params.id);

    if(!note){
        res.status(404);
        throw new Error("Note not found");
    }

    const user = await User.findById(req.user._id);
    const alreadyBookmarked = user.bookmarks.some((id) => id.toString() === note._id.toString());

    if(alreadyBookmarked) {
        user.bookmarks = user.bookmarks.filter((id) => id.toString() !== note._id.toString());
    } else{
        user.bookmarks.push(note._id);
    }

    await user.save();
    res.json({ success: true, bookmarked: !alreadyBookmarked });
}); 

// @desc Get notes uploaded by the logged-in user
// @route GET /api/notes/mine/all
// @access Private
const getMyNotes = asyncHandler(async (req, res) => {
    const notes = await Note.find({ uploadedBy: req.user._id }).sort({ createdAt: -1 });
    
    res.json({ success: true, notes });
});

module.exports = {
    createNote,
    getNotes,
    getNoteById,
    updateNote,
    deleteNote,
    downloadNote,
    toggleLike,
    toggleBookmark,
    getMyNotes,
};