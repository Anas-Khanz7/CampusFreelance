const express = require("express");
const app = express();

const bcrypt = require("bcryptjs");
const session = require("express-session");

const connectDB = require("./config/db");
const isLoggedIn = require("./middleware/auth");

const User = require("./models/User");
const Project = require("./models/Project");
const Application = require("./models/Application");

const port = 8080;

// ==================== DATABASE CONNECTION ====================

connectDB();

// ==================== MIDDLEWARE ====================

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: "campusFreelanceSecretKey",
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000
    }
}));

app.use(express.static("public"));

// ==================== EJS SETUP ====================

app.set("view engine", "ejs");

// ==================== HOME ROUTE ====================

app.get("/", (req, res) => {
    res.render("home");
});

// ==================== SIGNUP ROUTES ====================

app.get("/signup", (req, res) => {
    res.render("users/signup");
});

app.post("/signup", async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.send("Email already registered!");
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            role
        });

        await newUser.save();

        console.log("User registered successfully!");

        res.redirect("/login");

    } catch (err) {
        console.log(err);
        res.send("Error creating account!");
    }
});

// ==================== LOGIN ROUTES ====================

app.get("/login", (req, res) => {
    res.render("users/login");
});

app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.send("Invalid email or password!");
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.send("Invalid email or password!");
        }

        req.session.userId = user._id;
        req.session.username = user.username;
        req.session.role = user.role;

        console.log(`${user.username} logged in successfully!`);

        // Login redirect to Home
        res.redirect("/");

    } catch (err) {
        console.log(err);
        res.send("Login error!");
    }
});

// ==================== PROFILE ROUTE ====================

app.get("/profile", isLoggedIn, async (req, res) => {
    try {
        const myProjects = await Project.find({
            postedBy: req.session.userId
        });

        res.render("users/profile", {
            username: req.session.username,
            role: req.session.role,
            myProjects
        });

    } catch (err) {
        console.log(err);
        res.send("Error loading profile!");
    }
});

// ==================== CREATE PROJECT FORM ====================

app.get("/projects/new", isLoggedIn, (req, res) => {
    res.render("projects/new");
});

// ==================== CREATE PROJECT ====================

app.post("/projects", isLoggedIn, async (req, res) => {
    try {
        const { title, description, budget, skills, deadline } = req.body;

        const newProject = new Project({
            title,
            description,
            budget,
            skills: skills.split(",").map(skill => skill.trim()),
            deadline,
            postedBy: req.session.userId
        });

        await newProject.save();

        console.log("Project created successfully!");

        // Project submit redirect
        res.redirect("/projects");

    } catch (err) {
        console.log(err);
        res.send("Error posting project!");
    }
});

// ==================== SHOW ALL PROJECTS ====================

app.get("/projects", async (req, res) => {
    try {
        const allProjects = await Project.find({});

        res.render("projects/index", { allProjects });

    } catch (err) {
        console.log(err);
        res.send("Error fetching projects!");
    }
});

// ==================== PROJECT DETAILS ====================

app.get("/projects/:id", async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate("postedBy", "username email");

        if (!project) {
            return res.send("Project not found!");
        }

        res.render("projects/show", { project });

    } catch (err) {
        console.log(err);
        res.send("Error loading project details!");
    }
});

// ==================== APPLY FOR PROJECT ====================

app.post("/projects/:id/apply", isLoggedIn, async (req, res) => {
    try {
        const { proposal } = req.body;

        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.send("Project not found!");
        }

        if (project.postedBy.toString() === req.session.userId) {
            return res.send("You cannot apply to your own project!");
        }

        const existingApplication = await Application.findOne({
            project: project._id,
            applicant: req.session.userId
        });

        if (existingApplication) {
            return res.send("You have already applied!");
        }

        const newApplication = new Application({
            project: project._id,
            applicant: req.session.userId,
            proposal
        });

        await newApplication.save();

        console.log("Application submitted successfully!");

        // Application submit redirect
        res.redirect(`/projects/${project._id}`);

    } catch (err) {
        console.log(err);
        res.send("Error submitting application!");
    }
});

// ==================== VIEW APPLICATIONS ====================

app.get("/projects/:id/applications", isLoggedIn, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.send("Project not found!");
        }

        if (project.postedBy.toString() !== req.session.userId) {
            return res.send("Unauthorized access!");
        }

        const applications = await Application.find({
            project: project._id
        }).populate("applicant");

        res.render("projects/applications", {
            project,
            applications
        });

    } catch (err) {
        console.log(err);
        res.send("Error loading applications!");
    }
});

// ==================== LOGOUT ====================

app.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.send("Logout error!");
        }

        res.redirect("/login");
    });
});

// ==================== SERVER ====================

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});