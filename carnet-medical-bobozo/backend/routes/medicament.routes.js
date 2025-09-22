const express = require("express");
const router = express.Router();
const medicamentController = require("../controllers/medicament.controller");
const auth = require("../middlewares/auth.middleware");

/**
 * 💊 Routes de gestion des médicaments
 */

// 📋 Liste complète – accessible à tous les rôles connectés
router.get("/", auth(), medicamentController.getAllMedicaments);

// 🚨 Médicaments proches de la rupture – seulement pharmacien, admin, chef de service
// ⚠️ À placer avant "/:id" pour éviter les conflits
router.get(
  "/alertes",
  auth(["pharmacien", "admin", "chef_service"]),
  medicamentController.alertesStock
);

// 🔍 Obtenir un médicament par ID – accessible à tous les rôles connectés
router.get("/:id", auth(), medicamentController.getMedicamentById);

// ➕ Ajouter un médicament – réservé au pharmacien
router.post("/", auth("pharmacien", "admin"), medicamentController.createMedicament);

// ✏️ Modifier un médicament – réservé au pharmacien
router.put("/:id", auth("pharmacien", "admin"), medicamentController.updateMedicament);

// ❌ Supprimer un médicament – réservé au pharmacien
router.delete("/:id", auth("pharmacien", "admin"), medicamentController.deleteMedicament);

// ♻️ Réapprovisionner un médicament – réservé au pharmacien
router.post(
  "/:id/reapprovisionner",
  auth("pharmacien", "admin"),
  medicamentController.reapprovisionnerMedicament
);

module.exports = router;
