const express = require("express");
const router = express.Router();
const consultationController = require("../controllers/consultation.controller");
const auth = require("../middlewares/auth.middleware");

// ➕ Créer une consultation (admin + réceptionniste)
router.post("/", auth(["admin", "receptionniste"]), consultationController.createConsultation);

// 📋 Liste des consultations (admin, médecin, réceptionniste)
router.get("/", auth(["admin", "medecin", "receptionniste"]), consultationController.getAllConsultations);

// 📊 Dashboard consultations (admin uniquement)
router.get("/dashboard", auth(["admin"]), consultationController.getConsultationDashboard);

// ✅ Détails d’une consultation
router.get("/:id", auth(["admin", "medecin", "receptionniste"]), consultationController.getConsultationById);

// ✏️ Mettre à jour une consultation (médecin)
router.put("/:id", auth(["medecin", "admin"]), consultationController.updateConsultation);

// 🔄 Changer le statut d’une consultation (médecin ou admin)
router.put("/:id/statut", auth(["admin", "medecin"]), consultationController.changerStatutConsultation);

module.exports = router;