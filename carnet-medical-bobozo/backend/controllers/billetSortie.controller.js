// controllers/billetSortie.controller.js
const { BilletSortie, Hospitalisation, Utilisateur, Patient } = require("../models");
const PDFDocument = require("pdfkit");
// ➕ Créer un billet de sortie
exports.createBilletSortie = async (req, res) => {
  try {
    const {
      hospitalisation_id,
      medecin_id,
      date_sortie,
      motif_sortie,
      etat_patient_sortie,
      signature_agent,
    } = req.body || {};

    if (!hospitalisation_id || !date_sortie) {
      return res
        .status(400)
        .json({ error: "Hospitalisation et date de sortie sont obligatoires" });
    }

    // Vérifier hospitalisation
    const hosp = await Hospitalisation.findByPk(hospitalisation_id);
    if (!hosp) {
      return res.status(404).json({ error: "Hospitalisation non trouvée" });
    }

    // 🚫 Vérifier si un billet existe déjà
    const existingBillet = await BilletSortie.findOne({
      where: { hospitalisation_id },
    });
    if (existingBillet) {
      return res.status(400).json({
        error: "Un billet de sortie existe déjà pour cette hospitalisation",
      });
    }

    // ✅ Créer billet
    const billet = await BilletSortie.create({
      hospitalisation_id,
      medecin_id,
      date_sortie,
      motif_sortie,
      etat_patient_sortie,
      signature_agent,
    });

    // ✅ Mettre à jour hospitalisation
    await hosp.update({
      statut: "terminee",
      date_sortie: date_sortie,
    });

    res.status(201).json({
      message: "Billet de sortie créé ✅ et hospitalisation clôturée",
      billet,
      hospitalisation: hosp,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 📋 Liste des billets
exports.getAllBillets = async (req, res) => {
  try {
    const billets = await BilletSortie.findAll({
      include: [
        {
          model: Hospitalisation,
          as: "hospitalisation",
          include: [
            {
              model: Patient,
              as: "patient",
              attributes: ["id", "nom", "postnom", "prenom", "numero_dossier"],
            },
            // (Optionnel) décommente si tu veux aussi le médecin/infirmier de l'hospitalisation
            // { model: Utilisateur, as: "medecin", attributes: ["id", "noms", "email"] },
            // { model: Utilisateur, as: "infirmier", attributes: ["id", "noms", "email"] },
          ],
        },
        { model: Utilisateur, as: "medecin", attributes: ["id", "noms", "email"] }, // médecin signataire du billet
      ],
      order: [["id", "DESC"]],
    });

    res.json(billets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🔍 Détails d’un billet
exports.getBilletById = async (req, res) => {
  try {
    const billet = await BilletSortie.findByPk(req.params.id, {
      include: [
        {
          model: Hospitalisation,
          as: "hospitalisation",
          include: [
            {
              model: Patient,
              as: "patient",
              attributes: ["id", "nom", "postnom", "prenom", "numero_dossier"],
            },
            // (Optionnel)
            // { model: Utilisateur, as: "medecin", attributes: ["id", "noms", "email"] },
            // { model: Utilisateur, as: "infirmier", attributes: ["id", "noms", "email"] },
          ],
        },
        { model: Utilisateur, as: "medecin", attributes: ["id", "noms", "email"] },
      ],
    });

    if (!billet) return res.status(404).json({ error: "Billet non trouvé" });
    res.json(billet);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ❌ Suppression d’un billet
exports.deleteBillet = async (req, res) => {
  try {
    const billet = await BilletSortie.findByPk(req.params.id);
    if (!billet) return res.status(404).json({ error: "Billet non trouvé" });

    await billet.destroy();
    res.json({ message: "Billet supprimé 🗑️" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 📄 Génération du billet PDF
exports.genererBilletPDF = async (req, res) => {
  try {
    const billet = await BilletSortie.findByPk(req.params.id, {
      include: [
        {
          model: Hospitalisation,
          as: "hospitalisation",
          include: [
            { model: Patient, as: "patient", attributes: ["nom", "postnom", "prenom", "numero_dossier"] },
          ],
        },
        { model: Utilisateur, as: "medecin", attributes: ["noms", "email"] },
      ],
    });

    if (!billet) {
      return res.status(404).json({ error: "Billet non trouvé ❌" });
    }

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=billet_${billet.id}.pdf`);
    doc.pipe(res);

    doc.fontSize(18).text("Billet de sortie", { align: "center" });
    doc.moveDown();

    doc.fontSize(12).text(`Patient : ${billet.hospitalisation.patient.nom} ${billet.hospitalisation.patient.postnom} ${billet.hospitalisation.patient.prenom}`);
    doc.text(`N° dossier : ${billet.hospitalisation.patient.numero_dossier}`);
    doc.text(`Médecin : ${billet.medecin?.noms}`);
    doc.text(`Date sortie : ${billet.date_sortie}`);
    doc.moveDown();

    doc.text(`Motif sortie : ${billet.motif_sortie}`);
    doc.text(`État patient : ${billet.etat_patient_sortie}`);
    doc.text(`Signature : ${billet.signature_agent || "_________________"}`);

    doc.end();
  } catch (err) {
    console.error("Erreur PDF billet :", err);
    res.status(500).json({ error: "Erreur génération PDF ❌", details: err.message });
  }
};
