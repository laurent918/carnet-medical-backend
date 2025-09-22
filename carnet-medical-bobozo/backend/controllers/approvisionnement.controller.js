const { Approvisionnement, Medicament } = require("../models");

// ➕ Ajouter un approvisionnement (pharmacien uniquement)
exports.createApprovisionnement = async (req, res) => {
  try {
    const { medicament_id, quantite, fournisseur, date_approvisionnement } = req.body;

    if (!medicament_id || !quantite || !date_approvisionnement) {
      return res.status(400).json({ error: "Champs obligatoires manquants" });
    }

    // Création de l’approvisionnement
    const approvisionnement = await Approvisionnement.create({
      medicament_id,
      quantite,
      fournisseur,
      date_approvisionnement
    });

    // Mise à jour du stock du médicament
    const medicament = await Medicament.findByPk(medicament_id);
    if (medicament) {
      medicament.quantite_disponible += parseInt(quantite, 10);
      await medicament.save();
    }

    res.status(201).json({
      message: "Approvisionnement ajouté avec succès ✅",
      approvisionnement,
      medicament
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📋 Lister tous les approvisionnements
exports.getAllApprovisionnements = async (req, res) => {
  try {
    const approvisionnements = await Approvisionnement.findAll({
      include: [
        { model: Medicament, attributes: ["id", "nom_commercial", "quantite_disponible"] }
      ],
      order: [["date_approvisionnement", "DESC"]]
    });
    res.json(approvisionnements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 🔍 Obtenir un approvisionnement par ID
exports.getApprovisionnementById = async (req, res) => {
  try {
    const approvisionnement = await Approvisionnement.findByPk(req.params.id, {
      include: [
        { model: Medicament, attributes: ["id", "nom_commercial", "quantite_disponible"] }
      ]
    });

    if (!approvisionnement) {
      return res.status(404).json({ error: "Approvisionnement non trouvé" });
    }

    res.json(approvisionnement);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ❌ Supprimer un approvisionnement (⚠️ n’enlève pas du stock automatiquement pour éviter incohérences)
exports.deleteApprovisionnement = async (req, res) => {
  try {
    const approvisionnement = await Approvisionnement.findByPk(req.params.id);
    if (!approvisionnement) {
      return res.status(404).json({ error: "Approvisionnement non trouvé" });
    }

    await approvisionnement.destroy();
    res.json({ message: "Approvisionnement supprimé avec succès 🚮" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📜 Historique des approvisionnements par médicament
exports.getHistoriqueByMedicament = async (req, res) => {
  try {
    const { medicament_id } = req.params;

    const medicament = await Medicament.findByPk(medicament_id);
    if (!medicament) {
      return res.status(404).json({ message: "Médicament non trouvé ❌" });
    }

    const approvisionnements = await Approvisionnement.findAll({
      where: { medicament_id },
      order: [["date_approvisionnement", "DESC"]],
    });

    res.json({
      medicament,
      historique: approvisionnements,
    });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur ⚠️", error: err.message });
  }
};