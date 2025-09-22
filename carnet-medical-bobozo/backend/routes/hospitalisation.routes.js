const express = require("express");
const router = express.Router();
const hospitalisationController = require("../controllers/hospitalisation.controller");
const auth = require("../middlewares/auth.middleware");

// ➕ Admission d’un patient
router.post("/", auth(["medecin", "infirmier", "admin"]), hospitalisationController.createHospitalisation);

// 📋 Liste
router.get("/", auth(["admin", "medecin", "infirmier"]), hospitalisationController.getAllHospitalisations);

// 🔍 Détail par ID
router.get("/:id", auth(["admin", "medecin", "infirmier"]), hospitalisationController.getHospitalisationById);

// ✏️ Mise à jour
router.put("/:id", auth(["medecin", "infirmier", "admin"]), hospitalisationController.updateHospitalisation);

// 🔄 Changer le statut (admise → en_cours → clôturée)
router.put("/:id/statut", auth(["medecin", "admin"]), hospitalisationController.changerStatutHospitalisation);

// ❌ Supprimer
router.delete("/:id", auth(["admin"]), hospitalisationController.deleteHospitalisation);

// 📊 Dashboard
router.get("/dashboard/stats", auth(["admin"]), hospitalisationController.getHospitalisationDashboard);

module.exports = router;