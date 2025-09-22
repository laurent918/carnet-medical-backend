const {
  Patient,
  Hospitalisation,
  Consultation,
  Prescription,
  Medicament,
  Sequelize,
} = require("../models");

const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");

// ====================================================
// 📌 1. Vue Globale de l’hôpital
// ====================================================
const getVueGlobale = async (req, res) => {
  try {
    const totalPatients = await Patient.count();
    const totalHospitalisations = await Hospitalisation.count();
    const totalConsultations = await Consultation.count();
    const totalMedicaments = await Medicament.count();

    res.json({
      totalPatients,
      totalHospitalisations,
      totalConsultations,
      totalMedicaments,
    });
  } catch (error) {
    console.error("Erreur Vue Globale :", error);
    res.status(500).json({ error: "Erreur serveur ❌", details: error.message });
  }
};

// ====================================================
// 📌 2. Rapports SNIS
// ====================================================
const getRapportSNIS = async (req, res) => {
  try {
    const data = await getRapportSNISData();
    res.json(data);
  } catch (error) {
    console.error("Erreur Rapport SNIS :", error);
    res.status(500).json({ error: "Erreur serveur ❌", details: error.message });
  }
};

// 📄 PDF
const exportRapportSNISPDF = async (req, res) => {
  try {
    const data = await getRapportSNISData();

    const doc = new PDFDocument({ margin: 40 });
    const filename = `rapport_snis_${Date.now()}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=${filename}`);
    doc.pipe(res);

    doc.fontSize(20).text("Rapport SNIS", { align: "center" }).moveDown();
    Object.entries(data).forEach(([key, value]) => {
      doc.fontSize(12).text(`${key}: ${value}`);
    });

    doc.end();
  } catch (error) {
    console.error("Erreur export PDF SNIS:", error);
    res.status(500).json({ error: "Erreur génération PDF ❌", details: error.message });
  }
};

// 📊 Excel
const exportRapportSNISExcel = async (req, res) => {
  try {
    const data = await getRapportSNISData();

    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet("Rapport SNIS");

    ws.addRow(["Indicateur", "Valeur"]);
    Object.entries(data).forEach(([key, value]) => {
      ws.addRow([key, value]);
    });

    const filename = `rapport_snis_${Date.now()}.xlsx`;
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Erreur export Excel SNIS:", error);
    res.status(500).json({ error: "Erreur génération Excel ❌", details: error.message });
  }
};

// 🔎 Fonction utilitaire SNIS
async function getRapportSNISData() {
  return {
    patientsVus: await Consultation.count(),
    admissions: await Hospitalisation.count(),
    medicamentsUtilises: await Prescription.count(),
    deces: await Hospitalisation.count({ where: { statut: "decede" } }),
    transferts: await Hospitalisation.count({ where: { statut: "transfert" } }),
  };
}

// ====================================================
// 📌 3. Consolidation des rapports des chefs de service
// ====================================================
const getConsolidationRapports = async (req, res) => {
  try {
    const services = await Hospitalisation.findAll({
      attributes: ["service", [Sequelize.fn("COUNT", Sequelize.col("Hospitalisation.id")), "total"]],
      group: ["service"],
    });

    res.json(services);
  } catch (error) {
    console.error("Erreur Consolidation :", error);
    res.status(500).json({ error: "Erreur serveur ❌", details: error.message });
  }
};

// 📄 PDF Consolidation
const exportConsolidationPDF = async (req, res) => {
  try {
    const services = await Hospitalisation.findAll({
      attributes: ["service", [Sequelize.fn("COUNT", Sequelize.col("Hospitalisation.id")), "total"]],
      group: ["service"],
    });

    const doc = new PDFDocument({ margin: 40 });
    const filename = `consolidation_${Date.now()}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=${filename}`);
    doc.pipe(res);

    doc.fontSize(18).text("Consolidation Rapports Services", { align: "center" });
    doc.moveDown();

    services.forEach((s) => {
      doc.fontSize(12).text(`${s.service}: ${s.dataValues.total} hospitalisations`);
    });

    doc.end();
  } catch (error) {
    console.error("Erreur PDF Consolidation :", error);
    res.status(500).json({ error: "Erreur génération PDF ❌", details: error.message });
  }
};

// 📊 Excel Consolidation
const exportConsolidationExcel = async (req, res) => {
  try {
    const services = await Hospitalisation.findAll({
      attributes: ["service", [Sequelize.fn("COUNT", Sequelize.col("Hospitalisation.id")), "total"]],
      group: ["service"],
    });

    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet("Consolidation");

    ws.addRow(["Service", "Total hospitalisations"]);
    services.forEach((s) => {
      ws.addRow([s.service, s.dataValues.total]);
    });

    const filename = `consolidation_${Date.now()}.xlsx`;
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Erreur Excel Consolidation :", error);
    res.status(500).json({ error: "Erreur génération Excel ❌", details: error.message });
  }
};

// ====================================================
// 📌 4. Tableau de bord avancé
// ====================================================
const getDashboardAdmin = async (req, res) => {
  try {
    const data = await getDashboardData();
    res.json(data);
  } catch (error) {
    console.error("Erreur Dashboard Admin :", error);
    res.status(500).json({ error: "Erreur serveur ❌", details: error.message });
  }
};

// 📄 PDF Dashboard Admin
const exportDashboardAdminPDF = async (req, res) => {
  try {
    const data = await getDashboardData();

    const doc = new PDFDocument({ margin: 40 });
    const filename = `dashboard_admin_${Date.now()}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=${filename}`);
    doc.pipe(res);

    doc.fontSize(18).text("Tableau de bord avancé - Admin", { align: "center" });
    doc.moveDown();

    doc.fontSize(14).text("📌 Consultations par jour :");
    data.consultationsParJour.forEach((c) => {
      doc.text(`${c.dataValues.jour}: ${c.dataValues.total}`);
    });

    doc.moveDown().fontSize(14).text("💊 Médicaments consommés :");
    data.medicamentsConsommes.forEach((p) => {
      const nom = p.medicament?.nom_commercial ?? "Inconnu";
      const total = p.dataValues.total ?? p.get("total");
      doc.text(`- ${nom} : ${total}`);
    });

    doc.moveDown().fontSize(14).text(`🛏️ Lits occupés: ${data.litsOccupes}`);

    doc.end();
  } catch (error) {
    console.error("Erreur PDF Dashboard Admin:", error);
    res.status(500).json({ error: "Erreur génération PDF ❌", details: error.message });
  }
};

// 📊 Excel Dashboard Admin
const exportDashboardAdminExcel = async (req, res) => {
  try {
    const data = await getDashboardData();

    const workbook = new ExcelJS.Workbook();

    // Onglet consultations
    const ws1 = workbook.addWorksheet("Consultations");
    ws1.addRow(["Jour", "Total"]);
    data.consultationsParJour.forEach((c) => {
      ws1.addRow([c.dataValues.jour, c.dataValues.total]);
    });

    // Onglet médicaments
    const ws2 = workbook.addWorksheet("Medicaments");
    ws2.addRow(["Médicament", "Total"]);
    data.medicamentsConsommes.forEach((p) => {
      ws2.addRow([p.medicament?.nom_commercial ?? "Inconnu", Number(p.dataValues.total)]);
    });

    // Onglet lits
    const ws3 = workbook.addWorksheet("Lits");
    ws3.addRow(["Lits occupés"]);
    ws3.addRow([data.litsOccupes]);

    const filename = `dashboard_admin_${Date.now()}.xlsx`;
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Erreur Excel Dashboard Admin:", error);
    res.status(500).json({ error: "Erreur génération Excel ❌", details: error.message });
  }
};

// 🔎 Fonction utilitaire Dashboard Admin
async function getDashboardData() {
  const consultationsParJour = await Consultation.findAll({
    attributes: [
      [Sequelize.fn("DATE", Sequelize.col("date_consultation")), "jour"],
      [Sequelize.fn("COUNT", Sequelize.col("Consultation.id")), "total"],
    ],
    group: [Sequelize.fn("DATE", Sequelize.col("date_consultation"))],
    order: [[Sequelize.fn("DATE", Sequelize.col("date_consultation")), "ASC"]],
  });

  const medicamentsConsommes = await Prescription.findAll({
    attributes: [
      "medicament_id",
      [Sequelize.fn("COUNT", Sequelize.col("Prescription.id")), "total"],
    ],
    include: [{ model: Medicament, as: "medicament", attributes: ["id", "nom_commercial"] }],
    group: ["medicament_id", "medicament.id", "medicament.nom_commercial"],
    order: [[Sequelize.literal("total"), "DESC"]],
    limit: 10,
  });

  const litsOccupes = await Hospitalisation.count({ where: { statut: "en_cours" } });

  return { consultationsParJour, medicamentsConsommes, litsOccupes };
}

module.exports = {
  // Vue globale
  getVueGlobale,
  // SNIS
  getRapportSNIS,
  exportRapportSNISPDF,
  exportRapportSNISExcel,
  // Consolidation
  getConsolidationRapports,
  exportConsolidationPDF,
  exportConsolidationExcel,
  // Dashboard
  getDashboardAdmin,
  exportDashboardAdminPDF,
  exportDashboardAdminExcel,
};
