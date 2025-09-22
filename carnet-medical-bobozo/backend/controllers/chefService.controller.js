const {
  Patient,
  Hospitalisation,
  Consultation,
  ConstanteVitale,
  SoinInfirmier,
  Utilisateur,
  Sequelize,
} = require("../models");

const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");

// 📋 Supervision des patients du service
const superviserPatients = async (req, res) => {
  try {
    const { service } = req.user; // ⚠️ On suppose que le chef de service a "service" dans son profil

    const hospitalisations = await Hospitalisation.findAll({
      where: { service, statut: "en_cours" },
      include: [
        { model: Patient, as: "patient" },
        { model: Consultation, as: "consultations" },
        {
          model: SoinInfirmier,
          as: "soins",
          include: [{ model: Utilisateur, as: "infirmier", attributes: ["id", "noms"] }],
        },
        {
          model: ConstanteVitale,
          as: "constantes",
          order: [["date_mesure", "DESC"]],
          limit: 5,
        },
      ],
    });

    res.json(hospitalisations);
  } catch (error) {
    console.error("Erreur supervision patients :", error);
    res.status(500).json({ error: "Erreur serveur ❌", details: error.message });
  }
};

// 📊 Dashboard du service (avec période)
const getDashboardService = async (req, res) => {
  try {
    const { service } = req.user;
    const { start, end } = req.query; // 🔹 filtre optionnel

    // Construction de la clause WHERE dynamique
    const whereHospitalisation = { service };
    if (start && end) {
      whereHospitalisation.date_entree = {
        [Sequelize.Op.between]: [new Date(start), new Date(end)]
      };
    }

    // 🔹 Patients en cours
    const patientsEnCours = await Hospitalisation.count({
      where: { ...whereHospitalisation, statut: "en_cours" },
    });

    // 🔹 Admissions par jour
    const admissionsParJour = await Hospitalisation.findAll({
      attributes: [
        [Sequelize.fn("DATE", Sequelize.col("date_entree")), "jour"],
        [Sequelize.fn("COUNT", Sequelize.col("id")), "total"],
      ],
      where: whereHospitalisation,
      group: [Sequelize.fn("DATE", Sequelize.col("date_entree"))],
      order: [[Sequelize.fn("DATE", Sequelize.col("date_entree")), "ASC"]],
    });

   // 🔹 Constantes vitales moyennes
const constantesMoyennes = await ConstanteVitale.findOne({
  attributes: [
    [Sequelize.fn("AVG", Sequelize.col("temperature")), "temp_moy"],
    [Sequelize.fn("AVG", Sequelize.col("pouls")), "pouls_moy"],
    [Sequelize.fn("AVG", Sequelize.col("frequence_respiratoire")), "freq_moy"],
    [Sequelize.fn("AVG", Sequelize.col("glycemie")), "glycemie_moy"],
    [Sequelize.fn("AVG", Sequelize.col("spo2")), "spo2_moy"],
  ],
  include: [
    {
      model: Hospitalisation,
      as: "hospitalisation",
      where: whereHospitalisation,
      attributes: [], // ⚠️ très important pour éviter de polluer le SELECT
    },
  ],
  raw: true,
  plain: true,
});

    res.json({
      patientsEnCours,
      admissionsParJour,
      constantesMoyennes: constantesMoyennes[0]?.dataValues || {},
    });
  } catch (error) {
    console.error("Erreur dashboard service :", error);
    res.status(500).json({ error: "Erreur serveur ❌", details: error.message });
  }
};

// 📄 Rapport PDF du service
const exportRapportServicePDF = async (req, res) => {
  try {
    const { service } = req.user;

    const hospitalisations = await Hospitalisation.findAll({
      where: { service, statut: "en_cours" },
      include: [{ model: Patient, as: "patient" }],
    });

    const doc = new PDFDocument({ margin: 40 });
    const filename = `rapport_service_${service}_${Date.now()}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=${filename}`);
    doc.pipe(res);

    doc.fontSize(18).text(`Rapport Service ${service}`, { align: "center" });
    doc.moveDown();

    hospitalisations.forEach((h) => {
      doc.fontSize(12).text(
        `Patient: ${h.patient.nom} ${h.patient.prenom} | Entrée: ${h.date_entree} | Diagnostic: ${h.diagnostic_admission}`
      );
    });

    doc.end();
  } catch (error) {
    console.error("Erreur PDF rapport service :", error);
    res.status(500).json({ error: "Erreur génération PDF ❌", details: error.message });
  }
};

// 📊 Rapport Excel du service
const exportRapportServiceExcel = async (req, res) => {
  try {
    const { service } = req.user;

    const hospitalisations = await Hospitalisation.findAll({
      where: { service, statut: "en_cours" },
      include: [{ model: Patient, as: "patient" }],
    });

    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet("Rapport Service");

    ws.addRow(["Nom", "Prénom", "Date entrée", "Diagnostic"]);
    hospitalisations.forEach((h) => {
      ws.addRow([
        h.patient.nom,
        h.patient.prenom,
        h.date_entree,
        h.diagnostic_admission,
      ]);
    });

    const filename = `rapport_service_${service}_${Date.now()}.xlsx`;
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Erreur Excel rapport service :", error);
    res.status(500).json({ error: "Erreur génération Excel ❌", details: error.message });
  }
};


module.exports = {
  superviserPatients,
  getDashboardService,
  exportRapportServicePDF,
  exportRapportServiceExcel,
};
