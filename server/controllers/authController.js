const asyncHandler = require("express-async-handler");;
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

// @desc Register a new user
// @route POST /api/auth/register
// @access Public

const registerUser  = asyncHandler(async (req, res) => {
    const { name, email, password, college, branch, semester } = req.body;

    if(!name || !email || !password) {
        res.status(400);
        throw new Error("Please provide name, email and password");
    }

    const userExists = await User.findOne({ email });
    if(userExists) {
        res.status(400);
        throw new Error("An account with this email is already exists");
    }

    const user = await User.create({
        name,
        email,
        password,
        college,
        branch,
        semester,
    });

    const token = generateToken(user._id);

    res.status(201).json({
        success: true,
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            college: user.college,
            branch: user.branch,
            semester: user.semester,
            role: user.role,
        },
    });
});


// @desc Login user
// @route POST /api/auth/login
// @access Public

const loginUser =  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if(!email || !password) {
        res.status(400);
        throw new Error("Please provide email and password");
    }

    const user = await User.findOne({ email }).select("+password");

    if(!user || !(await user.matchPassword(password))) {
        res.status(401);
        throw new Error("Invalid email or password");
    }

    const token = generateToken(user._id);

    res.json({
        success: true,
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            college: user.college,
            branch: user.branch,
            semester: user.semester,
            role: user.role,
        },
    });
});

// @desc Get current logged-in user profile
// @route GET /api/auth/me
//access Private

const getMe = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).populate("bookmarks");
    
    res.json({ success: true, user });
});

// @desc Update current user profile
// @route PUT /api/auth/me
// @access Private

const updateMe = asyncHandler(async (req, res) => {
    const { name, college, branch, semester } = req.body;

    const user = await User.findById(req.user._id);

    if(!user) {
        res.status(404);
        throw new Error("User not found");
    }

    user.name = name ?? user.name;
    user.college = college ?? user.college;
    user.branch = branch ?? user.branch;
    user.semester = semester ?? user.semester;

    const updated = await user.save();

    res.json({
        success: true,
        user: {
            id: updated._id,
            name: updated.name,
            email: updated.email,
            college: updated.college,
            branch: updated.branch,
            semester: updated.semester,
            role: updated.role,
        },
    });
});

module.exports = { registerUser, loginUser, getMe, updateMe };