const db = require("../models");
const ResultatExamen = db.ResultatExamen;
const Examen = db.Examen;

module.exports = {
  // ➕ Enregistrer un résultat d’examen
  async ajouterResultat(req, res) {
    try {
      const { examen_id, parametre, valeur, unite, interpretation } = req.body;

      // Vérifier si l’examen existe
      const examen = await Examen.findByPk(examen_id);
      if (!examen) {
        return res.status(404).json({ error: "Examen non trouvé ❌" });
      }

      // Créer le résultat
      const resultat = await ResultatExamen.create({
        examen_id,
        parametre,
        valeur,
        unite,
        interpretation,
      });

      // Mettre à jour le statut (réalisé par le laborantin)
      await examen.update({ statut: "réalisé", date_examen: new Date() });

      res.json({
        message: "Résultat enregistré avec succès ✅",
        resultat,
      });
    } catch (error) {
      console.error("Erreur ajout résultat :", error);
      res.status(500).json({ error: "Erreur serveur ❌", details: error.message });
    }
  },

  // 📌 Récupérer tous les résultats
  async getAllResultats(req, res) {
    try {
      const resultats = await ResultatExamen.findAll({
        include: [{ model: Examen, as: "examen" }],
      });
      res.json(resultats);
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur ❌", details: error.message });
    }
  },

  // 📌 Récupérer les résultats d’un examen spécifique
  async getResultatsByExamen(req, res) {
    try {
      const { examenId } = req.params;

      const examen = await Examen.findByPk(examenId, {
        include: [{ model: ResultatExamen, as: "resultats" }],
      });

      if (!examen) {
        return res.status(404).json({ error: "Examen non trouvé ❌" });
      }

      res.json({
        examen,
        resultats: examen.resultats,
      });
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur ❌", details: error.message });
    }
  },
};
