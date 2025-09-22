const { Consultation, Patient, Utilisateur, Prescription, Sequelize } = require("../models");

// ➕ Créer consultation
const createConsultation = async (req, res) => {
  try {
    const { patient_id, medecin_id, motif, diagnostic, traitement, date_consultation, tension_arterielle, pouls, frequence_respiratoire, poids, taille, temperature, glycemie, observations_initiales, examens_prescrits, resultats_examens, observations_medecin, orientation, etat_patient } = req.body;

    const patient = await Patient.findByPk(patient_id);
    if (!patient) return res.status(404).json({ error: "Patient non trouvé" });

    const medecin = await Utilisateur.findByPk(medecin_id);
    if (!medecin) return res.status(404).json({ error: "Médecin non trouvé" });

    const consultation = await Consultation.create({
      patient_id,
      medecin_id,
      motif,
      diagnostic,
      traitement,
      date_consultation: date_consultation || new Date(),
      tension_arterielle,
      pouls,
      frequence_respiratoire,
      poids,
      taille,
      temperature,
      glycemie,
      observations_initiales,
      examens_prescrits,
      resultats_examens,
      observations_medecin,
      orientation,
      etat_patient,
      statut: "ouverte",
    });

    res.status(201).json({ message: "Consultation créée ✅", consultation });
  } catch (error) {
    console.error("❌ Erreur création consultation:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// 📋 Liste consultations avec prescriptions
const getAllConsultations = async (req, res) => {
  try {
    const { statut } = req.query;
    const whereClause = {};
    if (statut) whereClause.statut = statut;

    const consultations = await Consultation.findAll({
      where: whereClause,
      include: [
        { model: Patient, as: "patient", attributes: ["id", "nom", "prenom"] },
        { model: Utilisateur, as: "medecin", attributes: ["id", "noms", "email"] },
        { model: Prescription, as: "prescriptions" }, // inclure prescriptions pour le frontend
      ],
      order: [["date_consultation", "DESC"]],
    });

    res.json(consultations);
  } catch (error) {
    console.error("❌ Erreur chargement consultations:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// 🔍 Détails consultation avec prescriptions
const getConsultationById = async (req, res) => {
  try {
    const consultation = await Consultation.findByPk(req.params.id, {
      include: [
        { model: Patient, as: "patient", attributes: ["id", "nom", "prenom"] },
        { model: Utilisateur, as: "medecin", attributes: ["id", "noms", "email"] },
        { model: Prescription, as: "prescriptions" },
      ],
    });

    if (!consultation) return res.status(404).json({ error: "Consultation non trouvée" });

    res.json(consultation);
  } catch (error) {
    console.error("❌ Erreur détail consultation:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ✏️ Mise à jour consultation
const updateConsultation = async (req, res) => {
  try {
    const consultation = await Consultation.findByPk(req.params.id);
    if (!consultation) return res.status(404).json({ error: "Consultation non trouvée" });

    await consultation.update(req.body);

    const updated = await Consultation.findByPk(req.params.id, {
      include: [
        { model: Patient, as: "patient", attributes: ["id", "nom", "prenom"] },
        { model: Utilisateur, as: "medecin", attributes: ["id", "noms", "email"] },
        { model: Prescription, as: "prescriptions" },
      ],
    });

    res.json({ message: "Consultation mise à jour ✅", consultation: updated });
  } catch (error) {
    console.error("❌ Erreur mise à jour consultation:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// 🔄 Changer statut
const changerStatutConsultation = async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    if (!["ouverte", "en_cours", "cloturee"].includes(statut)) {
      return res.status(400).json({ error: "Statut invalide" });
    }

    const consultation = await Consultation.findByPk(id);
    if (!consultation) return res.status(404).json({ error: "Consultation non trouvée" });

    await consultation.update({
      statut,
      date_consultation: statut === "cloturee" && !consultation.date_consultation ? new Date() : consultation.date_consultation,
    });

    res.json({ message: `Statut changé en ${statut}`, consultation });
  } catch (error) {
    console.error("❌ Erreur changement statut consultation:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// 📊 Dashboard
const getConsultationDashboard = async (req, res) => {
  try {
    const total = await Consultation.count();
    const ouvertes = await Consultation.count({ where: { statut: "ouverte" } });
    const enCours = await Consultation.count({ where: { statut: "en_cours" } });
    const cloturees = await Consultation.count({ where: { statut: "cloturee" } });

    const parMedecin = await Consultation.findAll({
      attributes: ["medecin_id", [Sequelize.fn("COUNT", Sequelize.col("Consultation.id")), "total"]],
      include: [{ model: Utilisateur, as: "medecin", attributes: ["id", "noms", "email"] }],
      group: ["medecin_id", "medecin.id"],
    });

    res.json({ total, ouvertes, enCours, cloturees, parMedecin });
  } catch (error) {
    console.error("❌ Erreur dashboard consultation:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

module.exports = {
  createConsultation,
  getAllConsultations,
  getConsultationById,
  updateConsultation,
  changerStatutConsultation,
  getConsultationDashboard,
};
