const express = require("express");
const router = express.Router();
const billetSortieController = require("../controllers/billetSortie.controller"); // ✅ vérifier chemin
const auth = require("../middlewares/auth.middleware");

// ✍️ Routes Billet de sortie
router.post("/", auth(["secretaire", "admin"]), billetSortieController.createBilletSortie);
router.get("/", auth(["secretaire", "medecin", "admin"]), billetSortieController.getAllBillets);
router.get("/:id", auth(["secretaire", "medecin", "admin"]), billetSortieController.getBilletById);
router.delete("/:id", auth("admin"), billetSortieController.deleteBillet);
router.get("/:id/pdf", auth(["admin", "medecin"]), billetSortieController.genererBilletPDF);

module.exports = router;