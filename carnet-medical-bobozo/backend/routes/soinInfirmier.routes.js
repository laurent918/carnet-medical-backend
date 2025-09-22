const express = require("express");
const router = express.Router();
const soinController = require("../controllers/soinInfirmier.controller");
const auth = require("../middlewares/auth.middleware");

// ➕ Enregistrer un soin (infirmier)
router.post("/", auth(["infirmier", "admin"]), soinController.createSoin);

// 📋 Suivi par hospitalisation
router.get("/hospitalisation/:id", auth(["infirmier", "medecin", "admin"]), soinController.getSoinsByHospitalisation);

// 📋 Suivi par consultation
router.get("/consultation/:id", auth(["infirmier", "medecin", "admin"]), soinController.getSoinsByConsultation);

// ✅ Validation du soin (médecin)
router.put("/:id/valider", auth(["medecin", "admin"]), soinController.validerSoin);

module.exports = router;