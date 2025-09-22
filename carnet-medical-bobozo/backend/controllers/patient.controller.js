const {
  Patient,
  Consultation,
  Examen,
  ResultatExamen,
  Prescription,
  Medicament,
  Hospitalisation,
  BilletSortie,
  Utilisateur,
  SoinInfirmier,
  Sequelize,
} = require("../models");


const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");

// 🌟 Créer un patient
const createPatient = async (req, res) => {
  try {
    const { nom, postnom, prenom, sexe, date_naissance, adresse, numero_dossier } = req.body;

    const exist = await Patient.findOne({ where: { numero_dossier } });
    if (exist) return res.status(400).json({ message: "Numéro de dossier déjà existant" });

    const patient = await Patient.create({
      nom,
      postnom,
      prenom,
      sexe,
      date_naissance,
      adresse,
      numero_dossier,
    });

    res.status(201).json({ message: "Patient créé avec succès", patient });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// 🌟 Lister tous les patients avec pagination + recherche
const getAllPatients = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    const offset = (page - 1) * limit;

    // 🔎 Filtre dynamique (nom, prénom, postnom ou numéro dossier)
    const where = {};
    if (search) {
      where[Sequelize.Op.or] = [
        { nom: { [Sequelize.Op.like]: `%${search}%` } },
        { postnom: { [Sequelize.Op.like]: `%${search}%` } },
        { prenom: { [Sequelize.Op.like]: `%${search}%` } },
        { numero_dossier: { [Sequelize.Op.like]: `%${search}%` } },
      ];
    }

    // 📥 Récupération avec pagination + filtre
    const { count, rows } = await Patient.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["date_enregistrement", "DESC"]],
    });

    res.json({
      total: count,
      page: parseInt(page),
      pages: Math.ceil(count / limit),
      patients: rows,
    });
  } catch (error) {
    console.error("Erreur getAllPatients :", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// 🌟 Voir un patient par ID
const getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.params.id);
    if (!patient) return res.status(404).json({ message: "Patient non trouvé" });
    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// 🌟 Mettre à jour un patient
const updatePatient = async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.params.id);
    if (!patient) return res.status(404).json({ message: "Patient non trouvé" });

    await patient.update(req.body);
    res.json({ message: "Patient mis à jour avec succès", patient });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// 🌟 Supprimer un patient
const deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.params.id);
    if (!patient) return res.status(404).json({ message: "Patient non trouvé" });

    await patient.destroy();
    res.json({ message: "Patient supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// 📖 Historique complet d’un patient (corrigé)
const getHistoriquePatient = async (req, res) => {
  try {
    const { id } = req.params;

    const patient = await Patient.findByPk(id, {
      include: [
        {
          model: Consultation,
          as: "consultations",
          include: [
            {
              model: Examen,
              as: "examens",
              include: [
                { model: ResultatExamen, as: "resultats" },
                { model: Utilisateur, as: "medecin", attributes: ["id", "noms", "email"] },
                { model: Utilisateur, as: "laborantin", attributes: ["id", "noms", "email"] }
              ]
            },
            {
              model: Prescription,
              as: "prescriptions",
              include: [{ model: Medicament, as: "medicament" }]
            },
            {
              model: SoinInfirmier,
              as: "soins", // ✅ alias correct
              include: [
                { model: Utilisateur, as: "infirmier", attributes: ["id", "noms", "email"] },
                { model: Utilisateur, as: "medecin", attributes: ["id", "noms", "email"] }
              ]
            }
          ]
        },
        {
          model: Hospitalisation,
          as: "hospitalisations",
          include: [{ model: BilletSortie, as: "billet_sortie" }]
        }
      ]
    });

    if (!patient) {
      return res.status(404).json({ error: "⛔ Patient non trouvé" });
    }

    res.json(patient);
  } catch (error) {
    console.error("❌ Erreur getHistoriquePatient :", error.message);
    res.status(500).json({ error: "Erreur serveur", details: error.message });
  }
};

// 📊 Dashboard patients
const getPatientDashboard = async (req, res) => {
  try {
    // 🔹 Total patients
    const total = await Patient.count();

    // 🔹 Répartition par sexe
    const parSexe = await Patient.findAll({
      attributes: [
        "sexe",
        [Sequelize.fn("COUNT", Sequelize.col("id")), "total"]
      ],
      group: ["sexe"]
    });

    // 🔹 Répartition par tranche d’âge
    const patients = await Patient.findAll({
      attributes: ["date_naissance"]
    });

    const now = new Date();
    let tranches = { "<18": 0, "18-35": 0, "36-60": 0, ">60": 0 };

    patients.forEach((p) => {
      if (!p.date_naissance) return;
      const age = Math.floor(
        (now - new Date(p.date_naissance)) / (365.25 * 24 * 60 * 60 * 1000)
      );
      if (age < 18) tranches["<18"]++;
      else if (age <= 35) tranches["18-35"]++;
      else if (age <= 60) tranches["36-60"]++;
      else tranches[">60"]++;
    });

    const parTrancheAge = Object.entries(tranches).map(([tranche, total]) => ({
      tranche,
      total
    }));

    // 🔹 Répartition par jour (basée sur date_enregistrement)
    const parJour = await Patient.findAll({
      attributes: [
        [Sequelize.fn("DATE", Sequelize.col("date_enregistrement")), "jour"],
        [Sequelize.fn("COUNT", Sequelize.col("id")), "total"]
      ],
      group: [Sequelize.fn("DATE", Sequelize.col("date_enregistrement"))],
      order: [[Sequelize.fn("DATE", Sequelize.col("date_enregistrement")), "ASC"]]
    });

    res.json({
      total,
      parSexe,
      parTrancheAge,
      parJour
    });
  } catch (error) {
    console.error("Erreur dashboard patients :", error);
    res.status(500).json({ error: "Erreur serveur ❌", details: error.message });
  }
};

// 🔎 Utilitaire commun : calcule les métriques du dashboard patients
async function computePatientDashboard() {
  const total = await Patient.count();

  const parSexe = await Patient.findAll({
    attributes: ["sexe", [Sequelize.fn("COUNT", Sequelize.col("id")), "total"]],
    group: ["sexe"],
  });

  // Tranches d'âge
  const patients = await Patient.findAll({ attributes: ["date_naissance"] });
  const now = new Date();
  let tranches = { "<18": 0, "18-35": 0, "36-60": 0, ">60": 0 };
  patients.forEach((p) => {
    if (!p.date_naissance) return;
    const age = Math.floor((now - new Date(p.date_naissance)) / (365.25 * 24 * 60 * 60 * 1000));
    if (age < 18) tranches["<18"]++;
    else if (age <= 35) tranches["18-35"]++;
    else if (age <= 60) tranches["36-60"]++;
    else tranches[">60"]++;
  });
  const parTrancheAge = Object.entries(tranches).map(([tranche, total]) => ({ tranche, total }));

  // Par jour (nécessite la colonne date_enregistrement)
  const parJour = await Patient.findAll({
    attributes: [
      [Sequelize.fn("DATE", Sequelize.col("date_enregistrement")), "jour"],
      [Sequelize.fn("COUNT", Sequelize.col("id")), "total"],
    ],
    group: [Sequelize.fn("DATE", Sequelize.col("date_enregistrement"))],
    order: [[Sequelize.fn("DATE", Sequelize.col("date_enregistrement")), "ASC"]],
  });

  return { total, parSexe, parTrancheAge, parJour };
}

// 📄 PDF : /patients/dashboard/pdf
const exportPatientDashboardPDF = async (req, res) => {
  try {
    const { total, parSexe, parTrancheAge, parJour } = await computePatientDashboard();

    const doc = new PDFDocument({ margin: 40 });
    const filename = `dashboard_patients_${Date.now()}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=${filename}`);
    doc.pipe(res);

    doc.fontSize(18).text("Dashboard Patients", { align: "center" });
    doc.moveDown();

    // Résumé
    doc.fontSize(12).text(`Total patients : ${total}`);
    doc.moveDown();

    // Par sexe
    doc.fontSize(14).text("Répartition par sexe", { underline: true });
    parSexe.forEach((row) => {
      doc.fontSize(12).text(`- ${row.sexe ?? "Non renseigné"} : ${row.dataValues.total}`);
    });
    doc.moveDown();

    // Par tranche d'âge
    doc.fontSize(14).text("Répartition par tranche d'âge", { underline: true });
    parTrancheAge.forEach((row) => {
      doc.fontSize(12).text(`- ${row.tranche} : ${row.total}`);
    });
    doc.moveDown();

    // Par jour
    doc.fontSize(14).text("Inscriptions par jour", { underline: true });
    parJour.forEach((row) => {
      doc.fontSize(12).text(`- ${row.dataValues.jour} : ${row.dataValues.total}`);
    });

    doc.end();
  } catch (error) {
    console.error("Erreur PDF dashboard patients :", error);
    res.status(500).json({ error: "Erreur génération PDF ❌", details: error.message });
  }
};

// 📊 Excel : /patients/dashboard/excel
const exportPatientDashboardExcel = async (req, res) => {
  try {
    const { total, parSexe, parTrancheAge, parJour } = await computePatientDashboard();

    const workbook = new ExcelJS.Workbook();
    const now = new Date();
    const filename = `dashboard_patients_${now.toISOString().split("T")[0]}.xlsx`;

    // Feuille Résumé
    const wsResume = workbook.addWorksheet("Résumé");
    wsResume.addRow(["Total patients", total]);

    // Feuille Par sexe
    const wsSexe = workbook.addWorksheet("Par sexe");
    wsSexe.addRow(["Sexe", "Total"]);
    parSexe.forEach((row) => wsSexe.addRow([row.sexe ?? "Non renseigné", Number(row.dataValues.total)]));

    // Feuille Tranches d'âge
    const wsAge = workbook.addWorksheet("Par âge");
    wsAge.addRow(["Tranche", "Total"]);
    parTrancheAge.forEach((row) => wsAge.addRow([row.tranche, row.total]));

    // Feuille Par jour
    const wsJour = workbook.addWorksheet("Par jour");
    wsJour.addRow(["Jour", "Total"]);
    parJour.forEach((row) => wsJour.addRow([row.dataValues.jour, Number(row.dataValues.total)]));

    // Envoi
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Erreur Excel dashboard patients :", error);
    res.status(500).json({ error: "Erreur génération Excel ❌", details: error.message });
  }
};

// 📄 PDF : /patients/:id/historique/pdf
const exportPatientHistoriquePDF = async (req, res) => {
  try {
    const { id } = req.params;
    const patient = await Patient.findByPk(id, {
      include: [
        {
          model: Consultation,
          as: "consultations",
          include: [
            { model: Examen, as: "examens", include: [{ model: ResultatExamen, as: "resultats" }] },
            { model: Prescription, as: "prescriptions", include: [{ model: Medicament, as: "medicament" }] },
            { model: SoinInfirmier, as: "soins", include: [{ model: Utilisateur, as: "infirmier", attributes: ["noms"] }] }
          ],
        },
        {
          model: Hospitalisation,
          as: "hospitalisations",
          include: [
            { model: BilletSortie, as: "billet_sortie" },
            { model: SoinInfirmier, as: "soins", include: [{ model: Utilisateur, as: "infirmier", attributes: ["noms"] }] }
          ],
        },
      ],
    });

    if (!patient) return res.status(404).json({ error: "Patient non trouvé" });

    const doc = new PDFDocument({ margin: 40 });
    const filename = `historique_patient_${patient.id}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=${filename}`);
    doc.pipe(res);

    // 🧾 Infos patient
    doc.fontSize(18).text("Historique Patient", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Nom : ${patient.nom} ${patient.postnom ?? ""} ${patient.prenom ?? ""}`);
    doc.text(`Sexe : ${patient.sexe}`);
    doc.text(`N° dossier : ${patient.numero_dossier}`);
    doc.moveDown();

    // 🔹 Consultations
    doc.fontSize(14).text("Consultations :", { underline: true });
    patient.consultations.forEach((c) => {
      doc.moveDown().fontSize(12).text(`Date : ${c.date_consultation} | Motif : ${c.motif}`);
      doc.text(`Diagnostic : ${c.diagnostic ?? "N/A"}`);
      doc.text(`Traitement : ${c.traitement ?? "N/A"}`);

      if (c.examens.length) {
        doc.moveDown().text("Examens :");
        c.examens.forEach((e) => {
          doc.text(`- ${e.type_examen} (${e.statut})`);
        });
      }

      if (c.prescriptions.length) {
        doc.moveDown().text("Prescriptions :");
        c.prescriptions.forEach((p) => {
          doc.text(`- ${p.medicament?.nom_commercial ?? "Médicament"} : ${p.posologie} (${p.statut})`);
        });
      }

      if (c.soins.length) {
        doc.moveDown().text("Soins infirmiers :");
        c.soins.forEach((s) => {
          doc.text(`- ${s.type_soin} (${s.date_soin}) par ${s.infirmier?.noms ?? "?"}`);
        });
      }
    });

    // 🔹 Hospitalisations
    doc.addPage().fontSize(14).text("Hospitalisations :", { underline: true });
    patient.hospitalisations.forEach((h) => {
      doc.moveDown().fontSize(12).text(`Service : ${h.service} | Entrée : ${h.date_entree} | Statut : ${h.statut}`);
      doc.text(`Diagnostic : ${h.diagnostic_admission}`);
      if (h.billet_sortie) {
        doc.text(`→ Sortie : ${h.billet_sortie.motif_sortie} (${h.billet_sortie.date_sortie})`);
      }

      if (h.soins.length) {
        doc.moveDown().text("Soins infirmiers :");
        h.soins.forEach((s) => {
          doc.text(`- ${s.type_soin} (${s.date_soin}) par ${s.infirmier?.noms ?? "?"}`);
        });
      }
    });

    doc.end();
  } catch (error) {
    res.status(500).json({ error: "Erreur génération PDF ❌", details: error.message });
  }
};

// 📊 Excel : /patients/:id/historique/excel
const exportPatientHistoriqueExcel = async (req, res) => {
  try {
    const { id } = req.params;

    const patient = await Patient.findByPk(id, {
      include: [
        {
          model: Consultation,
          as: "consultations",
          include: [
            {
              model: Examen,
              as: "examens",
              include: [{ model: ResultatExamen, as: "resultats" }]
            },
            {
              model: Prescription,
              as: "prescriptions",
              include: [{ model: Medicament, as: "medicament" }]
            },
            {
              model: SoinInfirmier,
              as: "soins",
              include: [
                { model: Utilisateur, as: "infirmier", attributes: ["id", "noms", "email"] },
                { model: Utilisateur, as: "medecin", attributes: ["id", "noms", "email"] }
              ]
            }
          ]
        },
        {
          model: Hospitalisation,
          as: "hospitalisations",
          include: [
            { model: BilletSortie, as: "billet_sortie" },
            {
              model: SoinInfirmier,
              as: "soins",
              include: [
                { model: Utilisateur, as: "infirmier", attributes: ["id", "noms", "email"] },
                { model: Utilisateur, as: "medecin", attributes: ["id", "noms", "email"] }
              ]
            }
          ]
        }
      ]
    });

    if (!patient) {
      return res.status(404).json({ error: "⛔ Patient non trouvé" });
    }

    const workbook = new ExcelJS.Workbook();
    const filename = `historique_patient_${patient.nom}_${Date.now()}.xlsx`;

    // 📄 Feuille Infos Patient
    const wsInfo = workbook.addWorksheet("Infos Patient");
    wsInfo.addRow(["Nom", patient.nom]);
    wsInfo.addRow(["Prénom", patient.prenom]);
    wsInfo.addRow(["Sexe", patient.sexe]);
    wsInfo.addRow(["Date Naissance", patient.date_naissance]);
    wsInfo.addRow(["Numéro dossier", patient.numero_dossier]);
    wsInfo.addRow(["Date enregistrement", patient.date_enregistrement]);

    // 📄 Feuille Consultations
    const wsConsult = workbook.addWorksheet("Consultations");
    wsConsult.addRow([
      "Date", "Motif", "Diagnostic", "Observations", "Soins infirmiers"
    ]);
    patient.consultations.forEach(c => {
      wsConsult.addRow([
        c.date_consultation,
        c.motif,
        c.diagnostic,
        c.observations_medecin,
        c.soins.map(s => `${s.type_soin} (${s.observations ?? ""})`).join(" | ")
      ]);
    });

    // 📄 Feuille Examens
    const wsExamens = workbook.addWorksheet("Examens");
    wsExamens.addRow(["Date", "Type", "Statut", "Résultats"]);
    patient.consultations.forEach(c => {
      c.examens.forEach(e => {
        wsExamens.addRow([
          e.date_examen,
          e.type_examen,
          e.statut,
          e.resultats.map(r => `${r.parametre}: ${r.valeur}${r.unite}`).join(" | ")
        ]);
      });
    });

    // 📄 Feuille Prescriptions
    const wsPresc = workbook.addWorksheet("Prescriptions");
    wsPresc.addRow(["Médicament", "Posologie", "Durée", "Statut"]);
    patient.consultations.forEach(c => {
      c.prescriptions.forEach(p => {
        wsPresc.addRow([
          p.medicament?.nom_commercial,
          p.posologie,
          p.duree,
          p.statut
        ]);
      });
    });

    // 📄 Feuille Hospitalisations
    const wsHosp = workbook.addWorksheet("Hospitalisations");
    wsHosp.addRow([
      "Date entrée", "Date sortie", "Service", "Diagnostic", "Soins", "Billet sortie"
    ]);
    patient.hospitalisations.forEach(h => {
      wsHosp.addRow([
        h.date_entree,
        h.date_sortie,
        h.service,
        h.diagnostic_admission,
        h.soins.map(s => `${s.type_soin} (${s.observations ?? ""})`).join(" | "),
        h.billet_sortie
          ? `Motif: ${h.billet_sortie.motif_sortie} | État: ${h.billet_sortie.etat_patient_sortie}`
          : "N/A"
      ]);
    });

    // Envoi du fichier
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Erreur Excel historique patient :", error);
    res.status(500).json({ error: "Erreur génération Excel ❌", details: error.message });
  }
};

// ✅ Exporter toutes les fonctions
module.exports = {
  createPatient,
  getAllPatients,
  getPatientById,
  updatePatient,
  deletePatient,
  getHistoriquePatient,
  getPatientDashboard,
  exportPatientDashboardPDF,
  exportPatientDashboardExcel,
  exportPatientHistoriquePDF,   
  exportPatientHistoriqueExcel,
};