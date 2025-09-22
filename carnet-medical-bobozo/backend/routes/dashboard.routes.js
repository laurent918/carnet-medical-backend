const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboard.controller");
const auth = require("../middlewares/auth.middleware");

// 📊 Dashboard pharmacie → Pharmacien + Admin
router.get("/pharmacie", auth(["pharmacien", "admin"]), dashboardController.getPharmacieDashboard);

// 📊 Dashboard médecin → Médecin uniquement
router.get("/medecin", auth("medecin", "admin"), dashboardController.getMedecinDashboard);

// 📊 Dashboard admin → Admin uniquement
router.get("/admin", auth("admin"), dashboardController.getAdminDashboard);

module.exports = router;
