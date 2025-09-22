// routes/examen.routes.js
const express = require("express");
const router = express.Router();
const examenController = require("../controllers/examen.controller");
const authMiddleware = require("../middlewares/auth.middleware");

/**
 * ✅ Middleware : Vérification d'ID valide (entier positif)
 */
const validateId = (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id) || id <= 0) {
      return res.status(400).json({ error: "ID invalide ❌" });
    }
    next();
  } catch (err) {
    console.error("Erreur validateId:", err);
    return res.status(400).json({ error: "ID invalide ❌" });
  }
};

/**
 * 📋 Récupérer tous les examens
 * Filtres disponibles :
 *   - ?type_examen=…
 *   - ?statut=prescrit|en_cours|valide
 *   - ?medecin_id=…
 *   - ?laborantin_id=…
 * Accès : admin, medecin, receptionniste, laborantin
 */
router.get(
  "/",
  authMiddleware(["admin", "medecin", "receptionniste", "laborantin"]),
  examenController.getAllExamens
);

/**
 * 🩺 Créer un nouvel examen (prescription)
 * Accès : admin, medecin
 */
router.post(
  "/",
  authMiddleware(["admin", "medecin"]),
  examenController.prescrireExamen
);

/**
 * ✏️ Modifier une prescription existante
 * Accès : admin, medecin
 */
router.put(
  "/:id",
  authMiddleware(["admin", "medecin"]),
  validateId,
  examenController.modifierExamen
);

/**
 * 🗑️ Supprimer un examen (et ses résultats)
 * Accès : admin, medecin
 */
router.delete(
  "/:id",
  authMiddleware(["admin", "medecin"]),
  validateId,
  examenController.supprimerExamen
);

/**
 * 📌 Obtenir un examen détaillé avec résultats
 * Accès : admin, medecin, laborantin, receptionniste
 */
router.get(
  "/:id",
  authMiddleware(["admin", "medecin", "laborantin", "receptionniste"]),
  validateId,
  examenController.getResultatsByExamen
);

/**
 * 🔬 Remplacer complètement les résultats d’un examen
 * Accès : admin, laborantin
 */
router.post(
  "/:id/resultats",
  authMiddleware(["admin", "laborantin"]),
  validateId,
  examenController.saisirResultat
);

/**
 * ✏️ Modifier un seul résultat d’examen
 * Accès : admin, laborantin
 */
router.put(
  "/resultats/:id",
  authMiddleware(["admin", "laborantin"]),
  validateId,
  examenController.modifierResultat
);

/**
 * 🧑‍⚕️ Ajouter / Modifier interprétation globale
 * Accès : admin, medecin
 */
router.put(
  "/:id/interpreter",
  authMiddleware(["admin", "medecin"]),
  validateId,
  examenController.interpreterExamen
);

/**
 * 📄 Générer un PDF du rapport d’examen
 * Accès : admin, medecin, laborantin
 */
router.get(
  "/:id/pdf",
  authMiddleware(["admin", "medecin", "laborantin"]),
  validateId,
  examenController.genererPDF
);

module.exports = router;
