const { Model, DataTypes } = require("sequelize");

class Consultation extends Model {
  static init(sequelize) {
    return super.init(
      {
        patient_id: { type: DataTypes.INTEGER, allowNull: false },
        medecin_id: { type: DataTypes.INTEGER },
        date_consultation: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        motif: { type: DataTypes.STRING(255) },
        tension_arterielle: { type: DataTypes.STRING(255) },
        pouls: { type: DataTypes.INTEGER },
        frequence_respiratoire: { type: DataTypes.INTEGER },
        poids: { type: DataTypes.DOUBLE },
        taille: { type: DataTypes.DOUBLE },
        temperature: { type: DataTypes.DOUBLE },
        glycemie: { type: DataTypes.DOUBLE },
        observations_initiales: { type: DataTypes.TEXT },
        diagnostic: { type: DataTypes.TEXT },
        examens_prescrits: { type: DataTypes.TEXT },
        resultats_examens: { type: DataTypes.TEXT },
        traitement: { type: DataTypes.TEXT },
        observations_medecin: { type: DataTypes.TEXT },
        orientation: { type: DataTypes.STRING(50) },
        etat_patient: { type: DataTypes.STRING(50) },

        // ✅ Harmonisation du workflow Consultation
        statut: {
          type: DataTypes.ENUM("ouverte", "en_cours", "cloturee"),
          defaultValue: "ouverte",
        },
      },
      {
        sequelize,
        modelName: "Consultation",
        tableName: "consultations",
        timestamps: false,
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.Patient, { foreignKey: "patient_id", as: "patient" });
    this.belongsTo(models.Utilisateur, { foreignKey: "medecin_id", as: "medecin" });
    this.hasMany(models.Examen, { foreignKey: "consultation_id", as: "examens" });
    this.hasMany(models.Prescription, { foreignKey: "consultation_id", as: "prescriptions" });
  }
}

module.exports = Consultation;
