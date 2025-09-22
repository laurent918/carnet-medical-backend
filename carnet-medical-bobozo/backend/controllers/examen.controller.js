// controllers/examen.controller.js
const db = require("../models");
const Examen = db.Examen;
const Consultation = db.Consultation;
const Patient = db.Patient;
const Utilisateur = db.Utilisateur;
const ResultatExamen = db.ResultatExamen;
const PDFDocument = require("pdfkit");
const { Op } = require("sequelize");

/**
 * Normalize un statut reçu en query / payload vers la forme canonique
 * attendue en base (ex : "validé" | "valide" -> "valide", "encours" -> "en_cours").
 */
function normalizeStatutQuery(raw) {
  if (!raw) return null;
  const s = String(raw).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (s === "valide" || s === "valide" /* already good */ || s === "validé") return "valide";
  if (s === "encours" || s === "en_cours" || s === "en cours") return "en_cours";
  if (s === "prescrit") return "prescrit";
  return s;
}

/**
 * 🩺 Prescrire un examen (admin / medecin)
 */
const prescrireExamen = async (req, res) => {
  try {
    const { consultation_id, type_examen } = req.body;
    if (!consultation_id || !type_examen) {
      return res.status(400).json({ error: "consultation_id et type_examen sont obligatoires" });
    }

    const consultation = await Consultation.findByPk(consultation_id);
    if (!consultation) return res.status(404).json({ error: "Consultation introuvable" });

    const examen = await Examen.create({
      consultation_id,
      medecin_id: req.user?.id ?? null,
      type_examen,
      statut: "prescrit",
      date_prescription: new Date(),
    });

    return res.status(201).json({ message: "Examen prescrit", examen });
  } catch (err) {
    console.error("prescrireExamen error:", err);
    return res.status(500).json({ error: "Erreur serveur", details: err.message });
  }
};

/**
 * ✏️ Modifier une prescription (admin / medecin)
 */
const modifierExamen = async (req, res) => {
  try {
    const { id } = req.params;
    const examen = await Examen.findByPk(id);
    if (!examen) return res.status(404).json({ error: "Examen non trouvé" });

    // empêchons modification si déjà validé (sauf admin)
    const normalizedStatut = normalizeStatutQuery(examen.statut);
    if (normalizedStatut === "valide" && req.user?.role !== "admin") {
      return res.status(403).json({ error: "Impossible de modifier un examen validé" });
    }

    const updates = {};
    if (req.body.type_examen !== undefined) updates.type_examen = req.body.type_examen;
    if (req.body.consultation_id !== undefined) updates.consultation_id = req.body.consultation_id;

    await examen.update(updates);
    return res.json({ message: "Examen mis à jour", examen });
  } catch (err) {
    console.error("modifierExamen error:", err);
    return res.status(500).json({ error: "Erreur serveur", details: err.message });
  }
};

/**
 * 🗑️ Supprimer un examen et ses résultats (admin / medecin)
 */
const supprimerExamen = async (req, res) => {
  const transaction = await Examen.sequelize.transaction();
  try {
    const examen = await Examen.findByPk(req.params.id, { transaction });
    if (!examen) {
      await transaction.rollback();
      return res.status(404).json({ error: "Examen non trouvé" });
    }

    const normalizedStatut = normalizeStatutQuery(examen.statut);
    if (normalizedStatut === "valide" && req.user?.role !== "admin") {
      await transaction.rollback();
      return res.status(403).json({ error: "Impossible de supprimer un examen validé" });
    }

    await ResultatExamen.destroy({ where: { examen_id: examen.id }, transaction });
    await examen.destroy({ transaction });

    await transaction.commit();
    return res.json({ message: "Examen supprimé" });
  } catch (err) {
    await transaction.rollback();
    console.error("supprimerExamen error:", err);
    return res.status(500).json({ error: "Erreur serveur", details: err.message });
  }
};

/**
 * 🔬 Laborantin : remplacer la liste complète des résultats d'un examen
 * (admin/laborantin)
 */
const saisirResultat = async (req, res) => {
  const transaction = await Examen.sequelize.transaction();
  try {
    const examen = await Examen.findByPk(req.params.id, { transaction });
    if (!examen) {
      await transaction.rollback();
      return res.status(404).json({ error: "Examen non trouvé" });
    }

    const currentStatut = normalizeStatutQuery(examen.statut);
    if (currentStatut === "valide" && req.user?.role !== "admin") {
      await transaction.rollback();
      return res.status(403).json({ error: "Cet examen est déjà validé" });
    }

    const { parametres } = req.body;
    if (!Array.isArray(parametres) || parametres.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ error: "Les résultats (parametres) sont obligatoires" });
    }

    // Supprime anciens et recrée
    await ResultatExamen.destroy({ where: { examen_id: examen.id }, transaction });

    const resultats = [];
    for (const p of parametres) {
      if (!p.parametre || (p.valeur === undefined || p.valeur === null || String(p.valeur).trim() === "")) {
        // skip invalid lines
        continue;
      }
      const r = await ResultatExamen.create(
        {
          examen_id: examen.id,
          parametre: p.parametre,
          valeur: p.valeur,
          unite: p.unite || null,
          interpretation: p.interpretation || null,
        },
        { transaction }
      );
      resultats.push(r);
    }

    // Mettre à jour examen : validé par le laborantin
    await examen.update(
      { statut: "valide", laborantin_id: req.user?.id ?? null, date_examen: new Date() },
      { transaction }
    );

    await transaction.commit();
    return res.json({ message: "Résultats enregistrés", examen, resultats });
  } catch (err) {
    await transaction.rollback();
    console.error("saisirResultat error:", err);
    return res.status(500).json({ error: "Erreur serveur", details: err.message });
  }
};

/**
 * 📋 Récupérer tous les examens (avec pagination & filtres)
 * Query params supported: page, limit, statut, type_examen, medecin_id, laborantin_id
 * Accessible par admin/medecin/laborantin/receptionniste (routes gèrent l'accès)
 */
const getAllExamens = async (req, res) => {
  try {
    // pagination
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.max(parseInt(req.query.limit || "100", 10), 1);
    const offset = (page - 1) * limit;

    // where
    const where = {};

    if (req.query.statut) {
      const s = normalizeStatutQuery(req.query.statut);
      if (s) where.statut = s;
    }

    if (req.query.type_examen) where.type_examen = req.query.type_examen;
    if (req.query.medecin_id) where.medecin_id = Number(req.query.medecin_id);
    if (req.query.laborantin_id) where.laborantin_id = Number(req.query.laborantin_id);

    // includes — on inclut explicitement Patient pour éviter erreurs par string include
    const includes = [
      {
        model: Consultation,
        as: "consultation",
        include: Patient ? [{ model: Patient, as: "patient" }] : [],
      },
      { model: Utilisateur, as: "medecin", attributes: ["id", "noms", "email"] },
      { model: Utilisateur, as: "laborantin", attributes: ["id", "noms", "email"] },
      { model: ResultatExamen, as: "resultats" },
    ];

    // find & count (retourne rows + count) — ordre par date_prescription (colonne réellement présente)
    const examens = await Examen.findAndCountAll({
      where,
      include: includes,
      order: [["date_prescription", "DESC"], ["id", "DESC"]],
      limit,
      offset,
    });

    return res.json({
      rows: examens.rows,
      count: examens.count,
      page,
      limit,
    });
  } catch (err) {
    console.error("getAllExamens error:", err);
    return res.status(500).json({ error: "Erreur serveur lors du chargement des examens", details: err.message });
  }
};

/**
 * 📌 Détails d’un examen (avec résultats)
 */
const getResultatsByExamen = async (req, res) => {
  try {
    const examen = await Examen.findByPk(req.params.id, {
      include: [
        { model: Consultation, as: "consultation", include: Patient ? [{ model: Patient, as: "patient" }] : [] },
        { model: Utilisateur, as: "medecin", attributes: ["id", "noms", "email"] },
        { model: Utilisateur, as: "laborantin", attributes: ["id", "noms", "email"] },
        { model: ResultatExamen, as: "resultats" },
      ],
    });
    if (!examen) return res.status(404).json({ error: "Examen non trouvé" });
    return res.json(examen);
  } catch (err) {
    console.error("getResultatsByExamen error:", err);
    return res.status(500).json({ error: "Erreur serveur", details: err.message });
  }
};

/**
 * ✏️ Modifier un résultat existant (admin / laborantin)
 */
const modifierResultat = async (req, res) => {
  try {
    const { id } = req.params;
    const { parametre, valeur, unite, interpretation } = req.body;

    const resultat = await ResultatExamen.findByPk(id, { include: [{ model: Examen, as: "examen" }] });
    if (!resultat) return res.status(404).json({ error: "Résultat non trouvé" });

    const examen = resultat.examen;
    const examenStatut = normalizeStatutQuery(examen?.statut);
    if (examenStatut === "valide" && req.user?.role !== "admin") {
      return res.status(403).json({ error: "Impossible de modifier un résultat d'un examen validé" });
    }

    await resultat.update({
      parametre: parametre ?? resultat.parametre,
      valeur: valeur ?? resultat.valeur,
      unite: unite ?? resultat.unite,
      interpretation: interpretation ?? resultat.interpretation,
    });

    return res.json({ message: "Résultat modifié", resultat });
  } catch (err) {
    console.error("modifierResultat error:", err);
    return res.status(500).json({ error: "Erreur serveur", details: err.message });
  }
};

/**
 * 🧑‍⚕️ Interprétation finale (médecin / admin)
 */
const interpreterExamen = async (req, res) => {
  try {
    const examen = await Examen.findByPk(req.params.id);
    if (!examen) return res.status(404).json({ error: "Examen non trouvé" });

    const { observations } = req.body;
    if (!observations || String(observations).trim() === "") {
      return res.status(400).json({ error: "L’interprétation est obligatoire" });
    }

    await examen.update({ observations });
    return res.json({ message: "Interprétation enregistrée", examen });
  } catch (err) {
    console.error("interpreterExamen error:", err);
    return res.status(500).json({ error: "Erreur serveur", details: err.message });
  }
};

/**
 * 📄 Générer un PDF (stream)
 */
const genererPDF = async (req, res) => {
  try {
    const examen = await Examen.findByPk(req.params.id, {
      include: [
        { model: Consultation, as: "consultation", include: Patient ? [{ model: Patient, as: "patient" }] : [] },
        { model: Utilisateur, as: "medecin", attributes: ["noms", "email"] },
        { model: Utilisateur, as: "laborantin", attributes: ["noms", "email"] },
        { model: ResultatExamen, as: "resultats" },
      ],
    });
    if (!examen) return res.status(404).json({ error: "Examen non trouvé" });

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=examen_${examen.id}.pdf`);
    doc.pipe(res);

    doc.fontSize(18).text("Rapport d’Examen Médical", { align: "center" }).moveDown();
    doc.fontSize(12)
      .text(`Patient : ${examen.consultation?.patient?.nom || "-"} ${examen.consultation?.patient?.prenom || ""}`)
      .text(`Type d’examen : ${examen.type_examen || "-"}`)
      .text(`Médecin : ${examen.medecin?.noms || "-"}`)
      .text(`Laborantin : ${examen.laborantin?.noms || "-"}`)
      .text(`Date prescription : ${examen.date_prescription ? examen.date_prescription.toISOString().split("T")[0] : "-"}`)
      .text(`Date réalisation : ${examen.date_examen ? examen.date_examen.toISOString().split("T")[0] : "-"}`)
      .moveDown()
      .text("Résultats :", { underline: true });

    (examen.resultats || []).forEach((r) => {
      doc.text(`- ${r.parametre} : ${r.valeur} ${r.unite || ""} (${r.interpretation || "-"})`);
    });

    if (examen.observations) {
      doc.moveDown().text("Interprétation globale :", { underline: true }).text(examen.observations);
    }

    doc.end();
  } catch (err) {
    console.error("genererPDF error:", err);
    return res.status(500).json({ error: "Erreur génération PDF", details: err.message });
  }
};

module.exports = {
  prescrireExamen,
  modifierExamen,
  supprimerExamen,
  saisirResultat,
  getAllExamens,
  getResultatsByExamen,
  modifierResultat,
  interpreterExamen,
  genererPDF,
};
