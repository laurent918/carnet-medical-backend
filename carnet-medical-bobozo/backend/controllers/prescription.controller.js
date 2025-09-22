const { Prescription, Consultation, Patient, Utilisateur, Medicament, sequelize, Sequelize } = require("../models");

// 🔧 Fonction utilitaire pour mettre à jour le statut du médicament
function majStatutDisponibilite(medicament) {
  if (medicament.quantite_disponible === 0) {
    medicament.statut_disponibilite = "rupture";
  } else if (medicament.quantite_disponible <= medicament.seuil_alerte) {
    medicament.statut_disponibilite = "alerte";
  } else {
    medicament.statut_disponibilite = "disponible";
  }
}

// 👨‍⚕️ Médecin : prescrire un médicament
const prescrirePrescription = async (req, res) => {
  try {
    const { consultation_id, medicament_id, medicament_nom, posologie, duree, observations, quantite } = req.body;

    if (!consultation_id || (!medicament_id && !medicament_nom) || !posologie || !duree || !quantite) {
      return res.status(400).json({ message: "Champs obligatoires manquants ❌" });
    }

    let prescriptionData = {
      consultation_id,
      posologie,
      duree,
      observations,
      statut: "en_attente",
      quantite_prescrite: quantite,
      quantite_delivree: 0,
    };

    if (medicament_id) {
      const medicament = await Medicament.findByPk(medicament_id);
      if (!medicament) return res.status(404).json({ message: "Médicament non trouvé ❌" });
      prescriptionData.medicament_id = medicament.id;
      prescriptionData.medicament_nom = medicament.nom_commercial;
      prescriptionData.medicament_unite = medicament.unite_nom_commercial;
    } else if (medicament_nom) {
      prescriptionData.medicament_nom = medicament_nom;
    }

    const prescription = await Prescription.create(prescriptionData);
    res.status(201).json({ message: "Prescription créée ✅", prescription });
  } catch (error) {
    console.error("Erreur prescrirePrescription:", error);
    res.status(500).json({ message: "Erreur serveur ❌", error: error.message });
  }
};

// 💊 Mise à jour d'une prescription
const majPrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findByPk(req.params.id);
    if (!prescription) return res.status(404).json({ message: "Prescription non trouvée ❌" });

    const { statut, observations, medicament_id, medicament_nom, quantite } = req.body;

    if (statut && !["en_attente", "délivrée"].includes(statut)) {
      return res.status(400).json({ message: "Statut invalide ❌" });
    }

    let updateData = {
      statut: statut || prescription.statut,
      observations: observations ?? prescription.observations,
      pharmacien_id: req.user?.id || prescription.pharmacien_id,
    };

    if (quantite !== undefined) updateData.quantite_prescrite = quantite;

    if (medicament_id) {
      const medicament = await Medicament.findByPk(medicament_id);
      if (!medicament) return res.status(404).json({ message: "Médicament non trouvé ❌" });
      updateData.medicament_id = medicament.id;
      updateData.medicament_nom = medicament.nom_commercial;
      updateData.medicament_unite = medicament.unite_nom_commercial;
    } else if (medicament_nom) {
      updateData.medicament_nom = medicament_nom;
      updateData.medicament_id = null;
      updateData.medicament_unite = null;
    }

    await prescription.update(updateData);

    res.json({ message: "Prescription mise à jour ✅", prescription });
  } catch (error) {
    console.error("Erreur majPrescription:", error);
    res.status(500).json({ message: "Erreur serveur ❌", error: error.message });
  }
};

// 💊 Pharmacien : délivrer une prescription
const delivrerPrescription = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { quantite_delivree } = req.body;
    const id = req.params.id;

    if (!quantite_delivree || quantite_delivree <= 0) {
      await t.rollback();
      return res.status(400).json({ message: "Quantité invalide ❌" });
    }

    const prescription = await Prescription.findByPk(id, { transaction: t });
    if (!prescription) {
      await t.rollback();
      return res.status(404).json({ message: "Prescription non trouvée ❌" });
    }

    if (!prescription.medicament_id) {
      await t.rollback();
      return res.status(400).json({ message: "Impossible de délivrer : médicament non référencé ❌" });
    }

    const medicament = await Medicament.findByPk(prescription.medicament_id, { transaction: t });
    if (!medicament) {
      await t.rollback();
      return res.status(404).json({ message: "Médicament non trouvé ❌" });
    }

    if (medicament.quantite_disponible < quantite_delivree) {
      await t.rollback();
      return res.status(400).json({ message: "Stock insuffisant ❌", rupture: true });
    }

    medicament.quantite_disponible -= quantite_delivree;
    majStatutDisponibilite(medicament);
    await medicament.save({ transaction: t });

    await prescription.update(
      {
        statut: "délivrée",
        pharmacien_id: req.user.id,
        quantite_delivree,
      },
      { transaction: t }
    );

    await t.commit();
    res.json({ message: "Médicament délivré avec succès ✅", prescription, medicament });
  } catch (e) {
    await t.rollback();
    console.error("Erreur delivrerPrescription:", e);
    res.status(500).json({ message: "Erreur serveur ❌", error: e.message });
  }
};

// 📋 Lecture de toutes les prescriptions
const getAllPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.findAll({
      include: [
        {
          model: Consultation,
          as: "consultation",
          include: [
            { model: Patient, as: "patient", attributes: ["id", "nom", "prenom"] }
          ]
        },
        {
          model: Utilisateur,
          as: "pharmacien",
          attributes: ["id", "noms", "email"]
        },
        {
          model: Medicament,
          as: "medicament",
          attributes: ["id", "nom_commercial", "unite_nom_commercial"]
        }
      ],
      order: [["id", "DESC"]],
    });

    prescriptions.forEach((p) => {
      if (p.medicament) majStatutDisponibilite(p.medicament);
    });

    res.json(prescriptions);
  } catch (error) {
    console.error("Erreur getAllPrescriptions:", error);
    res.status(500).json({ message: "Erreur serveur ❌", error: error.message });
  }
};

// 📋 Prescriptions d’une consultation
const getPrescriptionsByConsultation = async (req, res) => {
  try {
    const { consultation_id } = req.params;

    const prescriptions = await Prescription.findAll({
      where: { consultation_id },
      include: [
        {
          model: Consultation,
          as: "consultation",
          include: [
            { model: Patient, as: "patient", attributes: ["id", "nom", "prenom"] }
          ]
        },
        {
          model: Utilisateur,
          as: "pharmacien",
          attributes: ["id", "noms", "email"]
        },
        {
          model: Medicament,
          as: "medicament",
          attributes: ["id", "nom_commercial", "unite_nom_commercial"]
        }
      ],
      order: [["id", "DESC"]],
    });

    res.json(prescriptions);
  } catch (error) {
    console.error("Erreur getPrescriptionsByConsultation:", error);
    res.status(500).json({ message: "Erreur serveur ❌", error: error.message });
  }
};

// 📊 Dashboard des prescriptions
const getPrescriptionDashboard = async (req, res) => {
  try {
    const total = await Prescription.count();
    const enAttente = await Prescription.count({ where: { statut: "en_attente" } });
    const delivrees = await Prescription.count({ where: { statut: "délivrée" } });

    const parMedicament = await Prescription.findAll({
      attributes: [
        "medicament_id",
        [Sequelize.fn("COUNT", Sequelize.col("Prescription.id")), "total"]
      ],
      include: [{ model: Medicament, as: "medicament", attributes: ["id", "nom_commercial"] }],
      group: ["medicament_id", "medicament.id", "medicament.nom_commercial"]
    });

    const parJour = await Prescription.findAll({
      attributes: [
        [Sequelize.fn("DATE", Sequelize.col("Prescription.date_prescription")), "jour"],
        [Sequelize.fn("COUNT", Sequelize.col("Prescription.id")), "total"]
      ],
      group: [Sequelize.fn("DATE", Sequelize.col("Prescription.date_prescription"))],
      order: [[Sequelize.fn("DATE", Sequelize.col("Prescription.date_prescription")), "ASC"]]
    });

    res.json({ total, enAttente, delivrees, parMedicament, parJour });
  } catch (error) {
    console.error("Erreur getPrescriptionDashboard:", error);
    res.status(500).json({ message: "Erreur serveur ❌", error: error.message });
  }
};

module.exports = {
  prescrirePrescription,
  majPrescription,
  delivrerPrescription,
  getAllPrescriptions,
  getPrescriptionsByConsultation,
  getPrescriptionDashboard
};
