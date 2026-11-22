const mongoose = require("mongoose");

async function connectDB() {
    try {
        await mongoose.connect("mongodb://127.0.0.1:27017/campusFreelance");

        console.log("MongoDB Connected Successfully!");
    } 
    catch (err) {
        console.log("MongoDB Connection Error:", err);
    }
}

module.exports = connectDB;