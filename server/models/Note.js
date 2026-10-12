const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Title is required"],
            trim: true,
        },
        description: {
            type: String,
            trim: true,
            default: "",
        },
        subject: {
            type: String,
            required: [true, "Subject is required"],
            trim: true,
        },
        branch: {
            type: String,
            required: [true, "Branch is required"],
            trim: true,
        },
        semester: {
            type: Number,
            required: [true, "Semester is required"],
            min: 1,
            max: 12,
        },
        tags: [{ type: String, trim: true }],
        fileUrl: {
            type: String,
            required: true,
        },
        fileName: {
            type: String,
            required: true,
        },
        fileType: {
            type: String,
        },
        fileSize: {
            type: Number,
        },
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        downloads: {
            type: Number,
            default: 0,
        },
        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
    },
    { timestamps: true }
);

noteSchema.index({ title: "text", subject: "text", tags: "text", description: "text" });

module.exports = mongoose.model("Note", noteSchema);