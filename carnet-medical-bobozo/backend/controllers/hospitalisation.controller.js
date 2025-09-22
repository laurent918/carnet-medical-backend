const { Hospitalisation, Patient, Utilisateur, Sequelize } = require("../models");

// ➕ Admission d’un patient
exports.createHospitalisation = async (req, res) => {
  try {
    const {
      patient_id,
      medecin_id,
      infirmier_id,
      date_entree,
      service,
      diagnostic_admission,
      traitement,
      observations,
    } = req.body;

    if (!patient_id || !date_entree) {
      return res.status(400).json({ error: "Patient et date d'entrée sont obligatoires ❌" });
    }

    const hospitalisation = await Hospitalisation.create({
      patient_id,
      medecin_id,
      infirmier_id,
      date_entree,
      service,
      diagnostic_admission,
      traitement,
      observations,
      statut: "admise", // ✅ harmonisé
    });

    res.status(201).json({
      message: "Patient admis avec succès 🛏️",
      hospitalisation,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 📋 Liste des hospitalisations (avec filtrage)
exports.getAllHospitalisations = async (req, res) => {
  try {
    const { statut } = req.query;

    const whereClause = {};
    if (statut) whereClause.statut = statut;

    const hospitalisations = await Hospitalisation.findAll({
      where: whereClause,
      include: [
        { model: Patient, as: "patient" },
        { model: Utilisateur, as: "medecin", attributes: ["id", "noms", "email"] },
        { model: Utilisateur, as: "infirmier", attributes: ["id", "noms", "email"] },
      ],
    });

    res.json(hospitalisations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🔍 Détails d’une hospitalisation
exports.getHospitalisationById = async (req, res) => {
  try {
    const hospitalisation = await Hospitalisation.findByPk(req.params.id, {
      include: [
        { model: Patient, as: "patient" },
        { model: Utilisateur, as: "medecin", attributes: ["id", "noms", "email"] },
        { model: Utilisateur, as: "infirmier", attributes: ["id", "noms", "email"] },
      ],
    });

    if (!hospitalisation) {
      return res.status(404).json({ error: "Hospitalisation non trouvée ❌" });
    }

    res.json(hospitalisation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✏️ Mise à jour (changement service, observations…)
exports.updateHospitalisation = async (req, res) => {
  try {
    const hospitalisation = await Hospitalisation.findByPk(req.params.id);
    if (!hospitalisation) {
      return res.status(404).json({ error: "Hospitalisation non trouvée ❌" });
    }

    await hospitalisation.update(req.body);
    res.json({
      message: "Hospitalisation mise à jour ✅",
      hospitalisation,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🔄 Changer statut (admise → en_cours → clôturée)
exports.changerStatutHospitalisation = async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    if (!["admise", "en_cours", "cloturee"].includes(statut)) {
      return res.status(400).json({ error: "Statut invalide ❌" });
    }

    const hospitalisation = await Hospitalisation.findByPk(id);
    if (!hospitalisation) {
      return res.status(404).json({ error: "Hospitalisation non trouvée ❌" });
    }

    await hospitalisation.update({
      statut,
      date_sortie: statut === "cloturee" ? new Date() : hospitalisation.date_sortie,
    });

    res.json({ message: `Statut changé en ${statut} ✅`, hospitalisation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ❌ Supprimer une hospitalisation
exports.deleteHospitalisation = async (req, res) => {
  try {
    const hospitalisation = await Hospitalisation.findByPk(req.params.id);
    if (!hospitalisation) {
      return res.status(404).json({ error: "Hospitalisation non trouvée ❌" });
    }

    await hospitalisation.destroy();
    res.json({ message: "Hospitalisation supprimée avec succès 🗑️" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 📊 Dashboard hospitalisations
exports.getHospitalisationDashboard = async (req, res) => {
  try {
    const total = await Hospitalisation.count();
    const admises = await Hospitalisation.count({ where: { statut: "admise" } });
    const enCours = await Hospitalisation.count({ where: { statut: "en_cours" } });
    const cloturees = await Hospitalisation.count({ where: { statut: "clôturée" } });

    const parService = await Hospitalisation.findAll({
      attributes: [
        "service",
        [Sequelize.fn("COUNT", Sequelize.col("id")), "total"],
      ],
      group: ["service"],
    });

    res.json({
      total,
      admises,
      enCours,
      cloturees,
      parService,
    });
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la récupération du dashboard hospitalisations" });
  }
};