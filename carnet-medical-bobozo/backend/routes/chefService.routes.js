const express = require("express");
const router = express.Router();
const chefServiceController = require("../controllers/chefService.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// ✅ Toutes les routes accessibles uniquement au Chef de Service
router.use(authMiddleware(["chef_service", "admin"]));

// 📋 Supervision des patients de son service
router.get("/patients", chefServiceController.superviserPatients);

// 📊 Dashboard du service
router.get("/dashboard", chefServiceController.getDashboardService);

// 📄 Export PDF
router.get("/rapport/pdf", chefServiceController.exportRapportServicePDF);

// 📊 Export Excel
router.get("/rapport/excel", chefServiceController.exportRapportServiceExcel);

module.exports = router;
