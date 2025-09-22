const express = require("express");
const router = express.Router();
const prescriptionController = require("../controllers/prescription.controller");
const auth = require("../middlewares/auth.middleware"); // ✅ une seule fois

/**
 * 🧾 Routes de gestion des prescriptions
 */

// 👨‍⚕️ Médecin / Admin : créer une prescription
router.post(
  "/",
  auth(["medecin", "admin"]),
  prescriptionController.prescrirePrescription
);

// 💊 Pharmacien / Admin : mettre à jour le statut ou observations
router.put(
  "/:id",
  auth(["pharmacien", "admin", "medecin"]),
  prescriptionController.majPrescription
);

// 💊 Pharmacien / Admin : délivrer un médicament (gestion du stock)
router.put(
  "/:id/delivrer",
  auth(["pharmacien", "admin"]),
  prescriptionController.delivrerPrescription
);

// 📋 Tous les rôles autorisés (admin, pharmacien, médecin) : liste complète
router.get(
  "/",
  auth(["admin", "pharmacien", "medecin"]),
  prescriptionController.getAllPrescriptions
);

// 📋 Prescriptions par consultation
router.get(
  "/consultation/:consultation_id",
  auth(["admin", "medecin", "pharmacien"]),
  prescriptionController.getPrescriptionsByConsultation
);

// 📊 Dashboard prescriptions
router.get(
  "/dashboard",
  auth(["admin"]),
  prescriptionController.getPrescriptionDashboard
);

module.exports = router;