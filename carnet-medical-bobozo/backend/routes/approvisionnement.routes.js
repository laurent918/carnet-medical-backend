const express = require("express");
const router = express.Router();
const approvisionnementController = require("../controllers/approvisionnement.controller");
const auth = require("../middlewares/auth.middleware");

// 💊 pharmacien uniquement
router.post("/", auth("pharmacien", "admin"), approvisionnementController.createApprovisionnement);
router.get("/", auth(["pharmacien", "admin"]), approvisionnementController.getAllApprovisionnements);

// 📜 Historique d’un médicament (⚠️ à placer avant /:id)
router.get("/historique/:medicament_id", auth(["pharmacien", "admin"]), approvisionnementController.getHistoriqueByMedicament);

router.get("/:id", auth(["pharmacien", "admin"]), approvisionnementController.getApprovisionnementById);
router.delete("/:id", auth("admin"), approvisionnementController.deleteApprovisionnement);

module.exports = router;
