const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const Request = require("../models/Request");
const Note = require("../models/Note");

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Loads a request with everything the detail page needs
const loadFull = (id) =>
    Request.findById(id)
        .populate("requestedBy", "name college")
        .populate("fulfillments.user", "name")
        .populate("fulfillments.note", "title subject fileName isVerified");

const findOr404 = async (req, res) => {
    if(!mongoose.isValidObjectId(req.params.id)) {
        res.status(404);
        throw new Error("Request not found");
    }
    const request = await Request.findById(req.params.id);
    if(!request) {
        res.status(404);
        throw new Error("Request not found");
    }
    return request;
};

const isOwnerOrAdmin = (request, user) =>
    request.requestedBy.toString() === user._id.toString() || user.role === "admin";

// @desc Create a notes request
// @route POST /api/requests
// @access Private
const createRequest = asyncHandler(async (req, res) => {
    const { title, description, subject, branch, semester } = req.body;

    if(!title || !subject || !branch || !semester) {
        res.status(400);
        throw new Error("Title, subject, branch and semester are required");
    }

    const request = await Request.create({
        title,
        description,
        subject,
        branch,
        semester,
        requestedBy: req.user._id,
    });

    res.status(201).json({ success: true, request });
});

// @desc List requests with filters, search, pagination
// @route GET /api/requests
// @access Public
const getRequests = asyncHandler(async (req, res) => {
    const { search, branch, semester, status, sort, page = 1, limit = 10 } = req.query;

    const query = {};
    if(status === "open" || status === "fulfilled") query.status = status;
    if(branch) query.branch = branch;
    if(semester) query.semester = Number(semester);
    if(search) {
        const rx = new RegExp(escapeRegex(search), "i");
        query.$or = [{ title: rx }, { subject: rx }, { description: rx }];
    }

    let sortOption = { createdAt: -1 };
    if(sort === "popular") sortOption = { supportCount: -1, createdAt: -1 };

    const skip = (Number(page) - 1) * Number(limit);

    const [requests, total] = await Promise.all([
        Request.find(query)
            .select("-supporters")
            .populate("requestedBy", "name college")
            .sort(sortOption)
            .skip(skip)
            .limit(Number(limit)),
        Request.countDocuments(query),
    ]);

    res.json({
        success: true,
        requests,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalResults: total,
    });
});

// @desc Get one request with offered notes
// @route GET /api/requests/:id
// @access Public
const getRequestById = asyncHandler(async (req, res) => {
    if(!mongoose.isValidObjectId(req.params.id)) {
        res.status(404);
        throw new Error("Request not found");
    }
    const request = await loadFull(req.params.id);

    if(!request) {
        res.status(404);
        throw new Error("Request not found");
    }

    res.json({ success: true, request });
});

// @desc Offer one of your notes for a request
// @route POST /api/requests/:id/fulfil   body: { noteId }
// @access Private
const fulfilRequest = asyncHandler(async (req, res) => {
    const request = await findOr404(req, res);
    const { noteId } = req.body;

    if(request.status === "fulfilled") {
        res.status(400);
        throw new Error("This request is already marked as solved");
    }

    if(request.requestedBy.toString() === req.user._id.toString()) {
        res.status(400);
        throw new Error("You can't offer a note for your own request");
    }

    if(!noteId || !mongoose.isValidObjectId(noteId)) {
        res.status(400);
        throw new Error("Please choose one of your notes");
    }

    const note = await Note.findById(noteId);
    if(!note) {
        res.status(404);
        throw new Error("Note not found");
    }

    if(note.uploadedBy.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error("You can only offer notes that you uploaded");
    }

    if(request.fulfillments.some((f) => f.note.toString() === note._id.toString())) {
        res.status(400);
        throw new Error("This note is already offered for this request");
    }

    request.fulfillments.push({ note: note._id, user: req.user._id });
    await request.save();

    res.status(201).json({ success: true, request: await loadFull(request._id) });
});

// @desc Withdraw an offered note (fulfiller, requester or staff)
// @route DELETE /api/requests/:id/fulfil/:fid
// @access Private
const removeFulfillment = asyncHandler(async (req, res) => {
    const request = await findOr404(req, res);
    const offer = request.fulfillments.id(req.params.fid);

    if(!offer) {
        res.status(404);
        throw new Error("Offer not found");
    }

    const isFulfiller = offer.user.toString() === req.user._id.toString();
    if(!isFulfiller && !isOwnerOrAdmin(request, req.user)) {
        res.status(403);
        throw new Error("Not authorized to remove this offer");
    }

    offer.deleteOne();
    await request.save();

    res.json({ success: true, request: await loadFull(request._id) });
});

// @desc Toggle "I need this too"
// @route PUT /api/requests/:id/support
// @access Private
const toggleSupport = asyncHandler(async (req, res) => {
    const request = await findOr404(req, res);

    if(request.requestedBy.toString() === req.user._id.toString()) {
        res.status(400);
        throw new Error("You already requested this");
    }

    const uid = req.user._id.toString();
    const already = request.supporters.some((id) => id.toString() === uid);

    if(already) {
        request.supporters = request.supporters.filter((id) => id.toString() !== uid);
    } else {
        request.supporters.push(req.user._id);
    }
    request.supportCount = request.supporters.length;

    await request.save();
    res.json({ success: true, supported: !already, supportCount: request.supportCount });
});

// @desc Mark a request solved / reopen it (requester or staff)
// @route PUT /api/requests/:id/resolve
// @access Private
const toggleResolve = asyncHandler(async (req, res) => {
    const request = await findOr404(req, res);

    if(!isOwnerOrAdmin(request, req.user)) {
        res.status(403);
        throw new Error("Only the requester can change this");
    }

    request.status = request.status === "open" ? "fulfilled" : "open";
    await request.save();

    res.json({ success: true, status: request.status });
});

// @desc Delete a request (requester or staff)
// @route DELETE /api/requests/:id
// @access Private
const deleteRequest = asyncHandler(async (req, res) => {
    const request = await findOr404(req, res);

    if(!isOwnerOrAdmin(request, req.user)) {
        res.status(403);
        throw new Error("Not authorized to delete this request");
    }

    await request.deleteOne();
    res.json({ success: true, message: "Request deleted" });
});

module.exports = {
    createRequest,
    getRequests,
    getRequestById,
    fulfilRequest,
    removeFulfillment,
    toggleSupport,
    toggleResolve,
    deleteRequest,
};
