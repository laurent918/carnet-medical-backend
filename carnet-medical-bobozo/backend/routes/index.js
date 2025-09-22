const express = require("express");
const router = express.Router();

// ✅ Import de toutes les routes
const authRoutes = require("./auth.routes");
const utilisateurRoutes = require("./utilisateur.routes");
const patientRoutes = require("./patient.routes");
const consultationRoutes = require("./consultation.routes");
const examenRoutes = require("./examen.routes");
const prescriptionRoutes = require("./prescription.routes");
const medicamentRoutes = require("./medicament.routes");
const approvisionnementRoutes = require("./approvisionnement.routes");
const dashboardRoutes = require("./dashboard.routes");
const hospitalisationRoutes = require("./hospitalisation.routes");
const billetSortieRoutes = require("./billetSortie.routes");
const resultatExamenRoutes = require("./resultatExamen.routes");
const pharmacieRoutes = require("./pharmacie.routes");
const soinInfirmierRoutes = require("./soinInfirmier.routes");
const constanteVitaleRoutes = require("./constanteVitale.routes");
const chefServiceRoutes = require("./chefService.routes")
const adminRoutes = require("./admin.routes");

// 🌐 Montage des routes sous le préfixe /api
router.use("/auth", authRoutes);
router.use("/utilisateurs", utilisateurRoutes);
router.use("/patients", patientRoutes);
router.use("/consultations", consultationRoutes);
router.use("/examens", examenRoutes);
router.use("/prescriptions", prescriptionRoutes);
router.use("/medicaments", medicamentRoutes);
router.use("/approvisionnements", approvisionnementRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/hospitalisations", hospitalisationRoutes);
router.use("/billets-sortie", billetSortieRoutes);
router.use("/resultats-examens", resultatExamenRoutes);
router.use("/pharmacie", pharmacieRoutes);
router.use("/soins-infirmiers", soinInfirmierRoutes);
router.use("/constantes-vitales", constanteVitaleRoutes);
router.use("/chef-service", chefServiceRoutes);
router.use("/admin", adminRoutes);

// ⚠️ Catch-all pour les routes inexistantes
router.use("*", (req, res) => {
  res.status(404).json({ message: "Route non trouvée" });
});

module.exports = router;