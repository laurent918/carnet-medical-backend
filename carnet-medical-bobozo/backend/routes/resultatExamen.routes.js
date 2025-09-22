const express = require("express");
const router = express.Router();
const resultatExamenController = require("../controllers/resultatExamen.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// ✅ Protéger toutes les routes Résultats avec authMiddleware
router.use(authMiddleware());

// ➕ Ajouter un résultat (Laborantin ou Admin)
router.post("/", authMiddleware(["laborantin", "admin"]), resultatExamenController.ajouterResultat);

// 📌 Récupérer tous les résultats (Laborantin, Médecin ou Admin)
router.get("/", authMiddleware(["laborantin", "medecin", "admin"]), resultatExamenController.getAllResultats);

// 📌 Récupérer les résultats d’un examen spécifique (Laborantin, Médecin ou Admin)
router.get("/examen/:examenId", authMiddleware(["laborantin", "medecin", "admin"]), resultatExamenController.getResultatsByExamen);

module.exports = router;
