const { ConstanteVitale, Hospitalisation, Utilisateur, Sequelize } = require("../models");
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");

// 🌟 Enregistrer une nouvelle constante vitale
const createConstanteVitale = async (req, res) => {
  try {
    const { hospitalisation_id, tension_arterielle, pouls, temperature, frequence_respiratoire, glycemie, spo2, observations } = req.body;

    if (!hospitalisation_id) {
      return res.status(400).json({ message: "Hospitalisation requise ❌" });
    }

    const constante = await ConstanteVitale.create({
      hospitalisation_id,
      infirmier_id: req.user.id,
      tension_arterielle,
      pouls,
      temperature,
      frequence_respiratoire,
      glycemie,
      spo2,
      observations,
    });

    res.status(201).json({ message: "Constante vitale enregistrée ✅", constante });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur ❌", error: error.message });
  }
};

// 📋 Récupérer toutes les constantes d’une hospitalisation
const getConstantesByHospitalisation = async (req, res) => {
  try {
    const { hospitalisation_id } = req.params;
    const constantes = await ConstanteVitale.findAll({
      where: { hospitalisation_id },
      include: [{ model: Utilisateur, as: "infirmier", attributes: ["id", "noms", "email"] }],
      order: [["date_mesure", "DESC"]],
    });

    res.json(constantes);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur ❌", error: error.message });
  }
};

// ✏️ Mettre à jour une constante
const updateConstanteVitale = async (req, res) => {
  try {
    const constante = await ConstanteVitale.findByPk(req.params.id);
    if (!constante) return res.status(404).json({ message: "Constante non trouvée ❌" });

    await constante.update(req.body);
    res.json({ message: "Constante mise à jour ✅", constante });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur ❌", error: error.message });
  }
};

// 🗑️ Supprimer une constante
const deleteConstanteVitale = async (req, res) => {
  try {
    const constante = await ConstanteVitale.findByPk(req.params.id);
    if (!constante) return res.status(404).json({ message: "Constante non trouvée ❌" });

    await constante.destroy();
    res.json({ message: "Constante supprimée ✅" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur ❌", error: error.message });
  }
};

// 📊 Dashboard (moyennes et suivi journalier)
const getDashboardConstantes = async (req, res) => {
  try {
    const parJour = await ConstanteVitale.findAll({
      attributes: [
        [Sequelize.fn("DATE", Sequelize.col("date_mesure")), "jour"],
        [Sequelize.fn("AVG", Sequelize.col("temperature")), "temp_moy"],
        [Sequelize.fn("AVG", Sequelize.col("pouls")), "pouls_moy"],
        [Sequelize.fn("AVG", Sequelize.col("frequence_respiratoire")), "freq_moy"],
        [Sequelize.fn("AVG", Sequelize.col("glycemie")), "glycemie_moy"],
        [Sequelize.fn("AVG", Sequelize.col("spo2")), "spo2_moy"],
      ],
      group: [Sequelize.fn("DATE", Sequelize.col("date_mesure"))],
      order: [[Sequelize.fn("DATE", Sequelize.col("date_mesure")), "ASC"]],
    });

    res.json({ parJour });
  } catch (error) {
    console.error("Erreur dashboard constantes :", error);
    res.status(500).json({ error: "Erreur serveur ❌", details: error.message });
  }
};

// 📄 PDF Dashboard
const exportDashboardConstantesPDF = async (req, res) => {
  try {
    const { parJour } = await getDashboardData();

    const doc = new PDFDocument({ margin: 40 });
    const filename = `dashboard_constantes_${Date.now()}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=${filename}`);
    doc.pipe(res);

    doc.fontSize(18).text("Dashboard Constantes Vitales", { align: "center" });
    doc.moveDown();

    parJour.forEach((row) => {
      doc.text(
        `${row.dataValues.jour} → Temp: ${Number(row.dataValues.temp_moy).toFixed(1)}°C | Pouls: ${Number(row.dataValues.pouls_moy).toFixed(1)} bpm | FR: ${Number(row.dataValues.freq_moy).toFixed(1)} | Glycémie: ${Number(row.dataValues.glycemie_moy).toFixed(1)} | SpO2: ${Number(row.dataValues.spo2_moy).toFixed(1)}%`
      );
    });

    doc.end();
  } catch (error) {
    res.status(500).json({ error: "Erreur génération PDF ❌", details: error.message });
  }
};

// 📊 Excel Dashboard
const exportDashboardConstantesExcel = async (req, res) => {
  try {
    const { parJour } = await getDashboardData();

    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet("Constantes Vitales");

    ws.addRow(["Jour", "Température (°C)", "Pouls (bpm)", "FR", "Glycémie", "SpO2"]);
    parJour.forEach((row) => {
      ws.addRow([
        row.dataValues.jour,
        Number(row.dataValues.temp_moy).toFixed(1),
        Number(row.dataValues.pouls_moy).toFixed(1),
        Number(row.dataValues.freq_moy).toFixed(1),
        Number(row.dataValues.glycemie_moy).toFixed(1),
        Number(row.dataValues.spo2_moy).toFixed(1),
      ]);
    });

    const filename = `dashboard_constantes_${Date.now()}.xlsx`;
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ error: "Erreur génération Excel ❌", details: error.message });
  }
};

// 🔎 Fonction utilitaire
async function getDashboardData() {
  const parJour = await ConstanteVitale.findAll({
    attributes: [
      [Sequelize.fn("DATE", Sequelize.col("date_mesure")), "jour"],
      [Sequelize.fn("AVG", Sequelize.col("temperature")), "temp_moy"],
      [Sequelize.fn("AVG", Sequelize.col("pouls")), "pouls_moy"],
      [Sequelize.fn("AVG", Sequelize.col("frequence_respiratoire")), "freq_moy"],
      [Sequelize.fn("AVG", Sequelize.col("glycemie")), "glycemie_moy"],
      [Sequelize.fn("AVG", Sequelize.col("spo2")), "spo2_moy"],
    ],
    group: [Sequelize.fn("DATE", Sequelize.col("date_mesure"))],
    order: [[Sequelize.fn("DATE", Sequelize.col("date_mesure")), "ASC"]],
  });

  return { parJour };
}

module.exports = {
  createConstanteVitale,
  getConstantesByHospitalisation,
  updateConstanteVitale,
  deleteConstanteVitale,
  getDashboardConstantes,
  exportDashboardConstantesPDF,
  exportDashboardConstantesExcel,
};