const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");

// 🔹 Connexion
router.post("/login", authController.login);

module.exports = router;
