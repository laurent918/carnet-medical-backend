const Sequelize = require("sequelize");
const sequelize = require("../config/db");

const db = {};

// Import des modèles
const Utilisateur = require("./utilisateur.model");
const Patient = require("./patient.model");
const Consultation = require("./consultation.model");
const Examen = require("./examen.model");
const ResultatExamen = require("./resultatExamen.model");
const Prescription = require("./prescription.model");
const Medicament = require("./medicament.model");
const Hospitalisation = require("./hospitalisation.model");
const Approvisionnement = require("./approvisionnement.model");
const BilletSortie = require("./billetSortie.model");
const SoinInfirmier = require("./soinInfirmier.model");
const ConstanteVitale = require("./constanteVitale.model");

// Initialisation des modèles
db.Utilisateur = Utilisateur.init(sequelize, Sequelize);
db.Patient = Patient.init(sequelize, Sequelize);
db.Consultation = Consultation.init(sequelize, Sequelize);
db.Examen = Examen.init(sequelize, Sequelize);
db.ResultatExamen = ResultatExamen.init(sequelize, Sequelize);
db.Prescription = Prescription.init(sequelize, Sequelize);
db.Medicament = Medicament.init(sequelize, Sequelize);
db.Hospitalisation = Hospitalisation.init(sequelize, Sequelize);
db.Approvisionnement = Approvisionnement.init(sequelize, Sequelize);
db.BilletSortie = BilletSortie.init(sequelize, Sequelize);
db.SoinInfirmier = SoinInfirmier.init(sequelize, Sequelize)
db.ConstanteVitale = ConstanteVitale.init(sequelize, Sequelize);

// ----------------------
// 📌 Associations
// ----------------------

// 🔹 Patient ↔ Consultations
db.Patient.hasMany(db.Consultation, { foreignKey: "patient_id", as: "consultations" });
db.Consultation.belongsTo(db.Patient, { foreignKey: "patient_id", as: "patient" });

// 🔹 Consultation ↔ Médecin (Utilisateur)
db.Consultation.belongsTo(db.Utilisateur, { foreignKey: "medecin_id", as: "medecin" });

// 🔹 Consultation ↔ Examens
db.Consultation.hasMany(db.Examen, { foreignKey: "consultation_id", as: "examens" });
db.Examen.belongsTo(db.Consultation, { foreignKey: "consultation_id", as: "consultation" });

// 🔹 Consultation ↔ Prescriptions
db.Consultation.hasMany(db.Prescription, { foreignKey: "consultation_id", as: "prescriptions" });
db.Prescription.belongsTo(db.Consultation, { foreignKey: "consultation_id", as: "consultation" });

// 🔹 Examen ↔ Médecin & Laborantin
db.Examen.belongsTo(db.Utilisateur, { foreignKey: "medecin_id", as: "medecin" });
db.Examen.belongsTo(db.Utilisateur, { foreignKey: "laborantin_id", as: "laborantin" });

// 🔹 Relations inverses côté Utilisateur
db.Utilisateur.hasMany(db.Examen, { foreignKey: "medecin_id", as: "examens_prescrits" });
db.Utilisateur.hasMany(db.Examen, { foreignKey: "laborantin_id", as: "examens_realises" });

// 🔹 Examen ↔ Résultats
db.Examen.hasMany(db.ResultatExamen, { foreignKey: "examen_id", as: "resultats" });
db.ResultatExamen.belongsTo(db.Examen, { foreignKey: "examen_id", as: "examen" });

// 🔹 Prescription ↔ Médicament & Pharmacien
db.Prescription.belongsTo(db.Medicament, { foreignKey: "medicament_id", as: "medicament" });
db.Prescription.belongsTo(db.Utilisateur, { foreignKey: "pharmacien_id", as: "pharmacien" });

// 🔹 Approvisionnement ↔ Médicament
db.Approvisionnement.belongsTo(db.Medicament, { foreignKey: "medicament_id", as: "medicament" });
db.Medicament.hasMany(db.Approvisionnement, { foreignKey: "medicament_id", as: "approvisionnements" });

// 🔹 Hospitalisation ↔ Patient, Médecin, Infirmier
db.Hospitalisation.belongsTo(db.Patient, { foreignKey: "patient_id", as: "patient" });
db.Patient.hasMany(db.Hospitalisation, { foreignKey: "patient_id", as: "hospitalisations" });

db.Hospitalisation.belongsTo(db.Utilisateur, { foreignKey: "medecin_id", as: "medecin" });
db.Hospitalisation.belongsTo(db.Utilisateur, { foreignKey: "infirmier_id", as: "infirmier" });

// 🔹 Billet de sortie ↔ Hospitalisation & Médecin
db.BilletSortie.belongsTo(db.Hospitalisation, { foreignKey: "hospitalisation_id", as: "hospitalisation" });
db.Hospitalisation.hasOne(db.BilletSortie, { foreignKey: "hospitalisation_id", as: "billet_sortie" });

db.BilletSortie.belongsTo(db.Utilisateur, { foreignKey: "medecin_id", as: "medecin" });

// 🔹 Soins infirmiers
db.SoinInfirmier.belongsTo(db.Hospitalisation, { foreignKey: "hospitalisation_id", as: "hospitalisation" });
db.SoinInfirmier.belongsTo(db.Consultation, { foreignKey: "consultation_id", as: "consultation" });
db.SoinInfirmier.belongsTo(db.Utilisateur, { foreignKey: "infirmier_id", as: "infirmier" });
db.SoinInfirmier.belongsTo(db.Utilisateur, { foreignKey: "medecin_id", as: "medecin" });

db.Hospitalisation.hasMany(db.SoinInfirmier, { foreignKey: "hospitalisation_id", as: "soins" });
db.Consultation.hasMany(db.SoinInfirmier, { foreignKey: "consultation_id", as: "soins" });
db.Utilisateur.hasMany(db.SoinInfirmier, { foreignKey: "infirmier_id", as: "soins_realises" });
db.Utilisateur.hasMany(db.SoinInfirmier, { foreignKey: "medecin_id", as: "soins_valides" });

// 🔹 Constantes vitales liées à hospitalisation & infirmier
db.ConstanteVitale.belongsTo(db.Hospitalisation, { foreignKey: "hospitalisation_id", as: "hospitalisation" });
db.ConstanteVitale.belongsTo(db.Utilisateur, { foreignKey: "infirmier_id", as: "infirmier" });

db.Hospitalisation.hasMany(db.ConstanteVitale, { foreignKey: "hospitalisation_id", as: "constantes" });
db.Utilisateur.hasMany(db.ConstanteVitale, { foreignKey: "infirmier_id", as: "constantes_realisees" });

// 🔹 Consultation ↔ Hospitalisation ✅ (ajouté)
db.Hospitalisation.hasMany(db.Consultation, {
  foreignKey: "hospitalisation_id",
  as: "consultations"
});
db.Consultation.belongsTo(db.Hospitalisation, {
  foreignKey: "hospitalisation_id",
  as: "hospitalisation"
});

// ----------------------
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;