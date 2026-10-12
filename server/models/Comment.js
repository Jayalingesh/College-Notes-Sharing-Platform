const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
    {
        note: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Note",
            required: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        text: {
            type: String,
            required: [true, "Comment text is required"],
            trim: true,
            maxlength: 1000,
        },
    },
    { timestamps: true }    
);

module.exports = mongoose.model("Comment", commentSchema);