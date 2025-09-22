const { SoinInfirmier, Utilisateur, Consultation, Hospitalisation } = require("../models");

// ➕ Infirmier : enregistrer un soin
exports.createSoin = async (req, res) => {
  try {
    const { hospitalisation_id, consultation_id, type_soin, observations } = req.body;

    if (!type_soin) {
      return res.status(400).json({ error: "Le type de soin est obligatoire ❌" });
    }

    const soin = await SoinInfirmier.create({
      hospitalisation_id,
      consultation_id,
      infirmier_id: req.user.id,
      type_soin,
      observations,
    });

    res.status(201).json({ message: "Soin infirmier enregistré ✅", soin });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 📋 Suivi par hospitalisation
exports.getSoinsByHospitalisation = async (req, res) => {
  try {
    const soins = await SoinInfirmier.findAll({
      where: { hospitalisation_id: req.params.id },
      include: [
        { model: Utilisateur, as: "infirmier", attributes: ["id", "noms", "email"] },
        { model: Utilisateur, as: "medecin", attributes: ["id", "noms", "email"] },
      ],
      order: [["date_soin", "DESC"]],
    });
    res.json(soins);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 📋 Suivi par consultation
exports.getSoinsByConsultation = async (req, res) => {
  try {
    const soins = await SoinInfirmier.findAll({
      where: { consultation_id: req.params.id },
      include: [
        { model: Utilisateur, as: "infirmier", attributes: ["id", "noms", "email"] },
        { model: Utilisateur, as: "medecin", attributes: ["id", "noms", "email"] },
      ],
      order: [["date_soin", "DESC"]],
    });
    res.json(soins);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Médecin : valider ou rejeter un soin
exports.validerSoin = async (req, res) => {
  try {
    const { statut_validation, remarque_medecin } = req.body;

    if (!["valide", "rejete"].includes(statut_validation)) {
      return res.status(400).json({ error: "Statut invalide ❌" });
    }

    const soin = await SoinInfirmier.findByPk(req.params.id);
    if (!soin) return res.status(404).json({ error: "Soin non trouvé ❌" });

    await soin.update({
      statut_validation,
      remarque_medecin,
      medecin_id: req.user.id,
    });

    res.json({ message: `Soin ${statut_validation} ✅`, soin });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
