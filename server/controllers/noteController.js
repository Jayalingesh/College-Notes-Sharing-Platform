const asyncHandler = require("express-async-handler");
const fs = require("fs");
const path = require("path");
const Note = require("../models/Note");
const User = require("../models/User");
const Comment = require("../models/Comment");

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

    const note = await Note.create({
        title,
        description,
        subject,
        branch,
        semester,
        tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        fileUrl: `/uploads/${req.file.filename}`,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        uploadedBy: req.user._id,
    });

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
    if(semester) query.semester = Number(semester);
    if(subject) query.subject = new RegExp(subject, "i");
    
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

    const filePath = path.join(__dirname, "..", note.fileUrl);
    fs.unlink(filePath, (err) => {
        if(err) console.warn("File already removed or not found:", filePath);
    });

    await Comment.deleteMany({ note: note._id });
    await note.deleteOne();

    res.json({ success: true, message: "Note deleted successfully" });
});

// @desc Track a download (increments counter, returns file path)
// @route GET /api/notes/:id/download
// @access Public

const downloadNote = asyncHandler(async (req, res) => {
    const note = await Note.findById(req.params.id);

    if(!note) {
        res.status(404);
        throw new Error("Note not found");
    }

    note.downloads += 1;
    await note.save();

    const filePath = path.join(__dirname, "..", note.fileUrl);

    if(!fs.existsSync(filePath)){
        res.status(404);
        throw new Error("File missing on server");
    }

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