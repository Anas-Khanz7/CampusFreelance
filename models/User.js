const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

    username: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true
    },

    role: {
        type: String,
        enum: ["student", "client", "admin"],
        default: "student"
    },

    skills: {
        type: [String],
        default: []
    },

    college: {
        type: String
    },

    bio: {
        type: String
    }

});

const User = mongoose.model("User", userSchema);

module.exports = User;