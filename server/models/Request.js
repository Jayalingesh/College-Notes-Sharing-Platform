const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Title is required"],
            trim: true,
            maxlength: 150,
        },
        description: {
            type: String,
            trim: true,
            maxlength: 1000,
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
        requestedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        // "I need this too" votes from other students
        supporters: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        supportCount: {
            type: Number,
            default: 0,
        },
        status: {
            type: String,
            enum: ["open", "fulfilled"],
            default: "open",
            index: true,
        },
        // Notes offered by other students to answer this request
        fulfillments: [
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
                createdAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
    },
    { timestamps: true }
);

module.exports = mongoose.model("Request", requestSchema);
