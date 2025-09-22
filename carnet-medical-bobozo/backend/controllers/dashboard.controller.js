const { Medicament, Approvisionnement, Prescription, Patient, Consultation, Examen, Utilisateur } = require("../models");

// 📊 Dashboard Pharmacie
const getPharmacieDashboard = async (req, res) => {
  try {
    const totalMedicaments = await Medicament.count();
    const totalApprovisionnements = await Approvisionnement.count();
    const prescriptionsEnAttente = await Prescription.count({ where: { statut: "en_attente" } });
    const prescriptionsDelivrees = await Prescription.count({ where: { statut: "delivree" } });

    // Médicaments en alerte stock
    const medicamentsAlertes = await Medicament.count({
      where: {
        quantite_disponible: { [require("sequelize").Op.lte]: require("sequelize").col("seuil_alerte") }
      }
    });

    res.json({
      totalMedicaments,
      totalApprovisionnements,
      prescriptionsEnAttente,
      prescriptionsDelivrees,
      medicamentsAlertes,
    });
  } catch (error) {
    console.error("Erreur dashboard pharmacie :", error);
    res.status(500).json({ error: "Erreur lors de la récupération du tableau de bord pharmacie" });
  }
};

// 📊 Dashboard Médecin
const getMedecinDashboard = async (req, res) => {
  try {
    const totalConsultations = await Consultation.count({ where: { medecin_id: req.user.id } });
    const totalPrescriptions = await Prescription.count();
    const totalExamens = await Examen.count();

    res.json({
      consultationsRealisees: totalConsultations,
      prescriptionsFaites: totalPrescriptions,
      examensDemandes: totalExamens,
    });
  } catch (error) {
    console.error("Erreur dashboard médecin :", error);
    res.status(500).json({ error: "Erreur lors de la récupération du tableau de bord médecin" });
  }
};

// 📊 Dashboard Admin
const getAdminDashboard = async (req, res) => {
  try {
    const totalUtilisateurs = await Utilisateur.count();
    const totalPatients = await Patient.count();
    const totalConsultations = await Consultation.count();
    const totalMedicaments = await Medicament.count();

    res.json({
      totalUtilisateurs,
      totalPatients,
      totalConsultations,
      totalMedicaments,
    });
  } catch (error) {
    console.error("Erreur dashboard admin :", error);
    res.status(500).json({ error: "Erreur lors de la récupération du tableau de bord admin" });
  }
};

module.exports = {
  getPharmacieDashboard,
  getMedecinDashboard,
  getAdminDashboard,
};
