const express = require("express");
const router = express.Router();
const patientController = require("../controllers/patient.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// ✅ Vérifie simplement l’authentification pour toutes les routes Patients
router.use(authMiddleware());

// 📊 Dashboard patients
router.get("/dashboard", authMiddleware(["admin"]), patientController.getPatientDashboard);
router.get("/dashboard/pdf", authMiddleware(["admin"]), patientController.exportPatientDashboardPDF);
router.get("/dashboard/excel", authMiddleware(["admin"]), patientController.exportPatientDashboardExcel);

// 📖 Historique complet d’un patient
router.get(
  "/:id/historique",
  authMiddleware(["admin", "receptionniste", "medecin", "infirmier"]),
  patientController.getHistoriquePatient
);

// 🧾 Gestion des patients
router.post("/", authMiddleware(["admin", "receptionniste"]), patientController.createPatient);
router.get("/", authMiddleware(["admin", "receptionniste", "medecin", "infirmier"]), patientController.getAllPatients);
router.get("/:id", authMiddleware(["admin", "receptionniste", "medecin", "infirmier"]), patientController.getPatientById);
router.put("/:id", authMiddleware(["admin", "receptionniste"]), patientController.updatePatient);
router.delete("/:id", authMiddleware(["admin"]), patientController.deletePatient);
router.get("/:id/historique/pdf", authMiddleware(["admin", "medecin"]), patientController.exportPatientHistoriquePDF);
router.get("/:id/historique/excel", authMiddleware(["admin", "medecin"]), patientController.exportPatientHistoriqueExcel);

module.exports = router;