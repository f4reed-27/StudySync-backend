// CommonJS build: avoids ESM config headaches on Render
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
console.log("Mongo URI:", process.env.MONGODB_URI);
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log("MongoDB connected"))
.catch((err) => console.error("MongoDB connection error", err))

import express from "express";
import cors from "cors"
const app = express();

// ----- Middleware
app.use(express.json());

// Lock CORS to your GitHub Pages site (add others if needed)
const allowedOrigin = process.env.ALLOWED_ORIGIN || "*";
app.use(
  cors({
    origin: allowedOrigin,
    methods: ["POST", "GET", "OPTIONS"],
    credentials: false,
  })
);

// ----- DB connect
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

// ----- Model
const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true }
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

// ----- Health check
app.get("/", (_req, res) => res.json({ ok: true, service: "StudySync Auth API" }));

// ----- Routes
// Register: "if exists, don't create; if not, create new"
app.post("/App/Register", async (req, res) => {
  try {
    const { email, password, passwordConfirm } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    if (passwordConfirm != null && password !== passwordConfirm) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      // keep frontend happy: 400 → they already show “user exists”
      return res.status(400).json({ message: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    await User.create({ email, password: hashed });

    // Keep it simple for your current frontend
    return res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Register error:", err);
    // Duplicate key (unique email) safety net
    if (err.code === 11000) {
      return res.status(400).json({ message: "User already exists" });
    }
    return res.status(500).json({ message: "Server error" });
  }
});

// Login
app.post("/App/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: "Invalid credentials" });

    // Your current frontend just expects success/failure
    return res.json({ message: "Login successful" });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ----- Boot
const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`🚀 API listening on port ${port}`));
