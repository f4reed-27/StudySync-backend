// Controllers/RegisterController.js
const User = require('../Models/User'); // adjust path if needed
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// routes/registerRoute.js
const express = require('express');
const RegisterController = require('../Controllers/RegisterController'); // ✅ path must be exact
const router = express.Router();

router.post('/register', RegisterController.registerUser);
router.post('/login', RegisterController.login);

module.exports = router;


// REGISTER USER
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // sanity check
    if (!name || !email || !password) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    // check if user already exists
    const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ msg: "User already exists" });
    }

    // hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // create new user
    const newUser = new User({
      name,
      email: email.trim().toLowerCase(),
      password: hashedPassword
    });

    await newUser.save();

    // optional: issue token
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET || "defaultsecret", {
      expiresIn: "1h"
    });

    res.status(201).json({
      msg: "User registered successfully",
      user: { id: newUser._id, name: newUser.name, email: newUser.email },
      token
    });

  } catch (err) {
    console.error("Register Error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
};

// LOGIN USER
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "defaultsecret", {
      expiresIn: "1h"
    });

    res.json({
      msg: "Login successful",
      user: { id: user._id, name: user.name, email: user.email },
      token
    });

  } catch (err) {
    console.error("Login Error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
};
