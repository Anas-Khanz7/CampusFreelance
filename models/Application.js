const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema({
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
        required: true
    },

    applicant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    proposal: {
        type: String,
        required: true
    },

    status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending"
    },

    appliedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Application", applicationSchema);