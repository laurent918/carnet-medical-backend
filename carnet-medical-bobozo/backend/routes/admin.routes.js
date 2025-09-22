const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");

// 🌍 Vue globale hôpital
router.get("/vue-globale", adminController.getVueGlobale);

// 📑 Rapport SNIS (JSON brut)
router.get("/rapport-snis", adminController.getRapportSNIS);

// 📄 Rapport SNIS PDF
router.get("/rapport-snis/pdf", adminController.exportRapportSNISPDF);

// 📊 Rapport SNIS Excel
router.get("/rapport-snis/excel", adminController.exportRapportSNISExcel);

// 📑 Consolidation rapports des chefs de service
router.get("/consolidation", adminController.getConsolidationRapports);

// 📄 Consolidation PDF
router.get("/consolidation/pdf", adminController.exportConsolidationPDF);

// 📊 Consolidation Excel
router.get("/consolidation/excel", adminController.exportConsolidationExcel);

// 📊 Tableau de bord avancé Admin
router.get("/dashboard", adminController.getDashboardAdmin);
router.get("/dashboard/pdf", adminController.exportDashboardAdminPDF);
router.get("/dashboard/excel", adminController.exportDashboardAdminExcel);

module.exports = router;
