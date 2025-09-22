const express = require("express");
const router = express.Router();
const {
  getPharmacieDashboard,
  getPharmacieDashboardPDF,
  getPharmacieDashboardExcel,
} = require("../controllers/pharmacie.controller");
const auth = require("../middlewares/auth.middleware");

// 📊 Dashboard JSON
router.get("/dashboard", auth(["admin", "pharmacien"]), getPharmacieDashboard);

// 📄 Dashboard PDF
router.get("/dashboard/pdf", auth(["admin", "pharmacien"]), getPharmacieDashboardPDF);

// 📘 Dashboard Excel
router.get("/dashboard/excel", auth(["admin", "pharmacien"]), getPharmacieDashboardExcel);

module.exports = router;