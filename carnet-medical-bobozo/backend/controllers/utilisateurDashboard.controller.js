// controllers/utilisateurDashboard.controller.js
const { Utilisateur, Sequelize } = require("../models");
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");

// 📊 Dashboard utilisateurs
const getUtilisateurDashboard = async (req, res) => {
  try {
    const total = await Utilisateur.count();

    // Répartition par rôle
    const parRole = await Utilisateur.findAll({
      attributes: ["role", [Sequelize.fn("COUNT", Sequelize.col("id")), "total"]],
      group: ["role"],
    });

    // Évolution inscriptions (par jour)
    const parJour = await Utilisateur.findAll({
      attributes: [
        [Sequelize.fn("DATE", Sequelize.col("date_creation")), "jour"],
        [Sequelize.fn("COUNT", Sequelize.col("id")), "total"]
      ],
      group: [Sequelize.fn("DATE", Sequelize.col("date_creation"))],
      order: [[Sequelize.fn("DATE", Sequelize.col("date_creation")), "ASC"]]
    });

    res.json({ total, parRole, parJour });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur ❌", details: err.message });
  }
};

// 📄 Export PDF du dashboard
const getUtilisateurDashboardPDF = async (req, res) => {
  try {
    const total = await Utilisateur.count();
    const parRole = await Utilisateur.findAll({
      attributes: ["role", [Sequelize.fn("COUNT", Sequelize.col("id")), "total"]],
      group: ["role"],
    });

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=dashboard_utilisateurs.pdf");
    doc.pipe(res);

    doc.fontSize(18).text("📊 Dashboard Utilisateurs", { align: "center" }).moveDown();

    doc.fontSize(12).text(`Total utilisateurs : ${total}`).moveDown();

    doc.text("Répartition par rôle :", { underline: true });
    parRole.forEach((r) => {
      doc.text(`- ${r.role} : ${r.dataValues.total}`);
    });

    doc.end();
  } catch (err) {
    res.status(500).json({ error: "Erreur génération PDF ❌", details: err.message });
  }
};

// 📊 Export Excel du dashboard
const getUtilisateurDashboardExcel = async (req, res) => {
  try {
    const total = await Utilisateur.count();
    const parRole = await Utilisateur.findAll({
      attributes: ["role", [Sequelize.fn("COUNT", Sequelize.col("id")), "total"]],
      group: ["role"],
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Dashboard Utilisateurs");

    sheet.columns = [
      { header: "Rôle", key: "role", width: 20 },
      { header: "Nombre", key: "total", width: 15 },
    ];

    parRole.forEach((r) => {
      sheet.addRow({ role: r.role, total: r.dataValues.total });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=dashboard_utilisateurs.xlsx");

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ error: "Erreur génération Excel ❌", details: err.message });
  }
};

module.exports = {
  getUtilisateurDashboard,
  getUtilisateurDashboardPDF,
  getUtilisateurDashboardExcel,
};