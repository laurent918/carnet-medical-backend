const express = require("express");
const router = express.Router();
const constanteVitaleController = require("../controllers/constanteVitale.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// Auth obligatoire
router.use(authMiddleware());

// CRUD
router.post("/", authMiddleware(["infirmier", "medecin", "admin"]), constanteVitaleController.createConstanteVitale);
router.get("/hospitalisation/:hospitalisation_id", authMiddleware(["admin", "medecin", "infirmier"]), constanteVitaleController.getConstantesByHospitalisation);
router.put("/:id", authMiddleware(["infirmier", "medecin", "admin"]), constanteVitaleController.updateConstanteVitale);
router.delete("/:id", authMiddleware(["admin"]), constanteVitaleController.deleteConstanteVitale);

// Dashboard
router.get("/dashboard", authMiddleware(["admin", "medecin"]), constanteVitaleController.getDashboardConstantes);
router.get("/dashboard/pdf", authMiddleware(["admin", "medecin"]), constanteVitaleController.exportDashboardConstantesPDF);
router.get("/dashboard/excel", authMiddleware(["admin", "medecin"]), constanteVitaleController.exportDashboardConstantesExcel);

module.exports = router;