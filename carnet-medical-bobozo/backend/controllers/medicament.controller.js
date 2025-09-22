const { Op, Sequelize } = require("sequelize");
const Medicament = require("../models/medicament.model");

/**
 * 🔧 Met à jour le statut de disponibilité selon la quantité
 */
function majStatutDisponibilite(medicament) {
  if (medicament.quantite_disponible === 0) {
    medicament.statut_disponibilite = "rupture";
  } else if (medicament.quantite_disponible <= medicament.seuil_alerte) {
    medicament.statut_disponibilite = "alerte";
  } else {
    medicament.statut_disponibilite = "disponible";
  }
}

/**
 * ➕ Ajouter un médicament
 */
exports.createMedicament = async (req, res) => {
  try {
    const {
      nom_commercial,
      unite_nom_commercial,
      nom_dci,
      unite_nom_dci,
      forme,
      unite_forme,
      dosage,
      voie_administration,
      quantite_disponible,
      unite_quantite,
      seuil_alerte,
      unite_seuil,
      date_expiration,
      fournisseur,
      observations
    } = req.body;

    if (!nom_commercial?.trim()) {
      return res.status(400).json({ error: "⚠️ Le nom commercial est obligatoire." });
    }

    const medicament = await Medicament.create({
      nom_commercial: nom_commercial.trim(),
      unite_nom_commercial: unite_nom_commercial?.trim() || null,
      nom_dci: nom_dci?.trim() || null,
      unite_nom_dci: unite_nom_dci?.trim() || null,
      forme: forme?.trim() || null,
      unite_forme: unite_forme?.trim() || null,
      dosage: dosage?.trim() || null,
      voie_administration: voie_administration?.trim() || null,
      quantite_disponible: quantite_disponible ?? 0,
      unite_quantite: unite_quantite?.trim() || null,
      seuil_alerte: seuil_alerte ?? 10,
      unite_seuil: unite_seuil?.trim() || null,
      date_expiration: date_expiration ?? null,
      fournisseur: fournisseur?.trim() || null,
      observations: observations ?? null,
    });

    majStatutDisponibilite(medicament);
    await medicament.save();

    res.status(201).json({ message: "✅ Médicament ajouté avec succès", medicament });
  } catch (err) {
    console.error("❌ Erreur création médicament :", err);
    res.status(500).json({ error: "Erreur serveur lors de l'enregistrement", details: err.message });
  }
};

/**
 * 📋 Liste de tous les médicaments
 */
exports.getAllMedicaments = async (req, res) => {
  try {
    const medicaments = await Medicament.findAll();
    medicaments.forEach(majStatutDisponibilite);
    res.json(medicaments);
  } catch (err) {
    console.error("❌ Erreur getAllMedicaments :", err);
    res.status(500).json({ error: "Erreur serveur lors du chargement", details: err.message });
  }
};

/**
 * 🔍 Obtenir un médicament par ID
 */
exports.getMedicamentById = async (req, res) => {
  try {
    const medicament = await Medicament.findByPk(req.params.id);
    if (!medicament) return res.status(404).json({ error: "Médicament non trouvé ❌" });

    majStatutDisponibilite(medicament);
    res.json(medicament);
  } catch (err) {
    console.error("❌ Erreur getMedicamentById :", err);
    res.status(500).json({ error: "Erreur serveur", details: err.message });
  }
};

/**
 * ✏️ Mettre à jour un médicament
 */
exports.updateMedicament = async (req, res) => {
  try {
    const medicament = await Medicament.findByPk(req.params.id);
    if (!medicament) return res.status(404).json({ error: "Médicament non trouvé ❌" });

    const {
      nom_commercial,
      unite_nom_commercial,
      nom_dci,
      unite_nom_dci,
      forme,
      unite_forme,
      dosage,
      voie_administration,
      quantite_disponible,
      unite_quantite,
      seuil_alerte,
      unite_seuil,
      date_expiration,
      fournisseur,
      observations
    } = req.body;

    if (nom_commercial !== undefined && nom_commercial.trim() === "") {
      return res.status(400).json({ error: "⚠️ Le nom commercial ne peut pas être vide." });
    }

    await medicament.update({
      nom_commercial: nom_commercial ?? medicament.nom_commercial,
      unite_nom_commercial: unite_nom_commercial ?? medicament.unite_nom_commercial,
      nom_dci: nom_dci ?? medicament.nom_dci,
      unite_nom_dci: unite_nom_dci ?? medicament.unite_nom_dci,
      forme: forme ?? medicament.forme,
      unite_forme: unite_forme ?? medicament.unite_forme,
      dosage: dosage ?? medicament.dosage,
      voie_administration: voie_administration ?? medicament.voie_administration,
      quantite_disponible: quantite_disponible ?? medicament.quantite_disponible,
      unite_quantite: unite_quantite ?? medicament.unite_quantite,
      seuil_alerte: seuil_alerte ?? medicament.seuil_alerte,
      unite_seuil: unite_seuil ?? medicament.unite_seuil,
      date_expiration: date_expiration ?? medicament.date_expiration,
      fournisseur: fournisseur ?? medicament.fournisseur,
      observations: observations ?? medicament.observations,
    });

    majStatutDisponibilite(medicament);
    await medicament.save();

    res.json({ message: "✅ Médicament mis à jour avec succès", medicament });
  } catch (err) {
    console.error("❌ Erreur updateMedicament :", err);
    res.status(500).json({ error: "Erreur serveur lors de la mise à jour", details: err.message });
  }
};

/**
 * ❌ Supprimer un médicament
 */
exports.deleteMedicament = async (req, res) => {
  try {
    const medicament = await Medicament.findByPk(req.params.id);
    if (!medicament) return res.status(404).json({ error: "Médicament non trouvé ❌" });

    await medicament.destroy();
    res.json({ message: "✅ Médicament supprimé avec succès" });
  } catch (err) {
    console.error("❌ Erreur deleteMedicament :", err);
    res.status(500).json({ error: "Erreur serveur lors de la suppression", details: err.message });
  }
};

/**
 * 🚨 Vérifier les médicaments en rupture ou proches du seuil
 */
exports.alertesStock = async (req, res) => {
  try {
    const ruptures = await Medicament.findAll({
      where: { quantite_disponible: { [Op.lte]: Sequelize.col("seuil_alerte") } },
    });
    ruptures.forEach(majStatutDisponibilite);
    res.json(ruptures);
  } catch (err) {
    console.error("❌ Erreur alertesStock :", err);
    res.status(500).json({ error: "Erreur serveur lors du chargement des alertes", details: err.message });
  }
};

/**
 * ♻️ Réapprovisionner un médicament
 */
exports.reapprovisionnerMedicament = async (req, res) => {
  try {
    const { quantite } = req.body;
    if (!quantite || quantite <= 0) return res.status(400).json({ error: "⚠️ Quantité invalide." });

    const medicament = await Medicament.findByPk(req.params.id);
    if (!medicament) return res.status(404).json({ error: "Médicament non trouvé ❌" });

    medicament.quantite_disponible += parseInt(quantite, 10);
    majStatutDisponibilite(medicament);
    await medicament.save();

    res.json({ message: "✅ Stock réapprovisionné avec succès", medicament });
  } catch (err) {
    console.error("❌ Erreur reapprovisionnerMedicament :", err);
    res.status(500).json({ error: "Erreur serveur lors du réapprovisionnement", details: err.message });
  }
};
