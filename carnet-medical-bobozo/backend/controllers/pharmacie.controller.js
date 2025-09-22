const { Medicament, Approvisionnement, Sequelize } = require("../models");
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");

// 📊 Dashboard pharmacie (JSON)
const getPharmacieDashboard = async (req, res) => {
  try {
    const totalMedicaments = await Medicament.count();
    const totalApprovisionnements = await Approvisionnement.count();

    const alertes = await Medicament.count({ where: { statut_disponibilite: "alerte" } });
    const ruptures = await Medicament.count({ where: { statut_disponibilite: "rupture" } });

    const parFournisseur = await Approvisionnement.findAll({
      attributes: ["fournisseur", [Sequelize.fn("COUNT", Sequelize.col("id")), "total"]],
      group: ["fournisseur"],
      order: [[Sequelize.fn("COUNT", Sequelize.col("id")), "DESC"]],
    });

    const parJour = await Approvisionnement.findAll({
      attributes: [
        [Sequelize.fn("DATE", Sequelize.col("date_approvisionnement")), "jour"],
        [Sequelize.fn("COUNT", Sequelize.col("id")), "total"],
      ],
      group: [Sequelize.fn("DATE", Sequelize.col("date_approvisionnement"))],
      order: [[Sequelize.fn("DATE", Sequelize.col("date_approvisionnement")), "ASC"]],
    });

    res.json({
      totalMedicaments,
      totalApprovisionnements,
      alertes,
      ruptures,
      parFournisseur,
      parJour,
    });
  } catch (error) {
    console.error("Erreur dashboard pharmacie :", error);
    res.status(500).json({ error: "Erreur serveur ❌", details: error.message });
  }
};

// 📄 Export PDF du dashboard
const getPharmacieDashboardPDF = async (req, res) => {
  try {
    const totalMedicaments = await Medicament.count();
    const totalApprovisionnements = await Approvisionnement.count();
    const alertes = await Medicament.count({ where: { statut_disponibilite: "alerte" } });
    const ruptures = await Medicament.count({ where: { statut_disponibilite: "rupture" } });

    const parFournisseur = await Approvisionnement.findAll({
      attributes: ["fournisseur", [Sequelize.fn("COUNT", Sequelize.col("id")), "total"]],
      group: ["fournisseur"],
      order: [[Sequelize.fn("COUNT", Sequelize.col("id")), "DESC"]],
    });

    const parJour = await Approvisionnement.findAll({
      attributes: [
        [Sequelize.fn("DATE", Sequelize.col("date_approvisionnement")), "jour"],
        [Sequelize.fn("COUNT", Sequelize.col("id")), "total"],
      ],
      group: [Sequelize.fn("DATE", Sequelize.col("date_approvisionnement"))],
      order: [[Sequelize.fn("DATE", Sequelize.col("date_approvisionnement")), "ASC"]],
    });

    // 📄 Génération PDF
    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=dashboard_pharmacie.pdf");
    doc.pipe(res);

    doc.fontSize(18).text("Rapport Dashboard Pharmacie", { align: "center" });
    doc.moveDown();

    // Statistiques globales
    doc.fontSize(12).text(`📦 Total Médicaments : ${totalMedicaments}`);
    doc.text(`📥 Total Approvisionnements : ${totalApprovisionnements}`);
    doc.text(`⚠️ Médicaments en alerte : ${alertes}`);
    doc.text(`⛔ Médicaments en rupture : ${ruptures}`);
    doc.moveDown();

    // Répartition par fournisseur
    doc.fontSize(14).text("Répartition par fournisseur :", { underline: true });
    parFournisseur.forEach((f) => {
      doc.fontSize(12).text(`- ${f.fournisseur || "Inconnu"} : ${f.dataValues.total}`);
    });
    doc.moveDown();

    // Répartition par jour
    doc.fontSize(14).text("Répartition des approvisionnements par jour :", { underline: true });
    parJour.forEach((j) => {
      doc.fontSize(12).text(`- ${j.dataValues.jour} : ${j.dataValues.total}`);
    });

    doc.end();
  } catch (error) {
    console.error("Erreur PDF pharmacie :", error);
    res.status(500).json({ error: "Erreur génération PDF ❌", details: error.message });
  }
};

// 📊 Export Excel du dashboard
const getPharmacieDashboardExcel = async (req, res) => {
  try {
    const totalMedicaments = await Medicament.count();
    const totalApprovisionnements = await Approvisionnement.count();
    const alertes = await Medicament.count({ where: { statut_disponibilite: "alerte" } });
    const ruptures = await Medicament.count({ where: { statut_disponibilite: "rupture" } });

    const parFournisseur = await Approvisionnement.findAll({
      attributes: ["fournisseur", [Sequelize.fn("COUNT", Sequelize.col("id")), "total"]],
      group: ["fournisseur"],
      order: [[Sequelize.fn("COUNT", Sequelize.col("id")), "DESC"]],
    });

    const parJour = await Approvisionnement.findAll({
      attributes: [
        [Sequelize.fn("DATE", Sequelize.col("date_approvisionnement")), "jour"],
        [Sequelize.fn("COUNT", Sequelize.col("id")), "total"],
      ],
      group: [Sequelize.fn("DATE", Sequelize.col("date_approvisionnement"))],
      order: [[Sequelize.fn("DATE", Sequelize.col("date_approvisionnement")), "ASC"]],
    });

    // 📘 Création du fichier Excel
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Dashboard Pharmacie");

    // 🔹 Titre
    sheet.mergeCells("A1", "B1");
    sheet.getCell("A1").value = "Rapport Dashboard Pharmacie";
    sheet.getCell("A1").font = { size: 16, bold: true };
    sheet.getCell("A1").alignment = { horizontal: "center" };

    // 🔹 Statistiques globales
    sheet.addRow([]);
    sheet.addRow(["📦 Total Médicaments", totalMedicaments]);
    sheet.addRow(["📥 Total Approvisionnements", totalApprovisionnements]);
    sheet.addRow(["⚠️ En alerte", alertes]);
    sheet.addRow(["⛔ En rupture", ruptures]);

    // 🔹 Répartition par fournisseur
    sheet.addRow([]);
    sheet.addRow(["Répartition par fournisseur"]);
    sheet.addRow(["Fournisseur", "Total"]);
    parFournisseur.forEach((f) => {
      sheet.addRow([f.fournisseur || "Inconnu", f.dataValues.total]);
    });

    // 🔹 Répartition par jour
    sheet.addRow([]);
    sheet.addRow(["Répartition par jour"]);
    sheet.addRow(["Jour", "Total"]);
    parJour.forEach((j) => {
      sheet.addRow([j.dataValues.jour, j.dataValues.total]);
    });

    // 📤 Envoi du fichier
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=dashboard_pharmacie.xlsx");

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Erreur Excel pharmacie :", error);
    res.status(500).json({ error: "Erreur génération Excel ❌", details: error.message });
  }
};

module.exports = {
  getPharmacieDashboard,
  getPharmacieDashboardPDF,
  getPharmacieDashboardExcel,
};
