const mongoose = require("mongoose");

// AI generated study material (loaded only when asked for)
const aiSummarySchema = new mongoose.Schema(
    {
        summary: String,
        keyPoints: [String],
        keyTerms: [{ term: String, meaning: String, _id: false }],
        generatedAt: Date,
    },
    { _id: false }
);

const aiQuizSchema = new mongoose.Schema(
    {
        questions: [
            {
                question: String,
                options: [String],
                answerIndex: Number,
                explanation: String,
                _id: false,
            },
        ],
        generatedAt: Date,
    },
    { _id: false }
);

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
            default: "",
        },
        fileId: {
            type: mongoose.Schema.Types.ObjectId,
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
        // Staff verification
        isVerified: {
            type: Boolean,
            default: false,
            index: true,
        },
        verifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        verifiedAt: {
            type: Date,
        },
        verificationRemark: {
            type: String,
            trim: true,
            maxlength: 200,
            default: "",
        },
        // AI study tools (kept out of normal queries)
        aiSummary: { type: aiSummarySchema, select: false },
        aiQuiz: { type: aiQuizSchema, select: false },
    },
    { timestamps: true }
);

noteSchema.index({ title: "text", subject: "text", tags: "text", description: "text" });

module.exports = mongoose.model("Note", noteSchema);