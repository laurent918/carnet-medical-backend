const { Model, DataTypes } = require("sequelize");

class Hospitalisation extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        patient_id: { type: DataTypes.INTEGER, allowNull: false },
        medecin_id: { type: DataTypes.INTEGER, allowNull: true },
        infirmier_id: { type: DataTypes.INTEGER, allowNull: true },
        date_entree: { type: DataTypes.DATEONLY, allowNull: false },
        date_sortie: { type: DataTypes.DATEONLY, allowNull: true },
        service: { type: DataTypes.STRING, allowNull: true },
        diagnostic_admission: { type: DataTypes.TEXT, allowNull: true },
        traitement: { type: DataTypes.TEXT, allowNull: true },
        observations: { type: DataTypes.TEXT, allowNull: true },

        // ✅ Harmonisation des statuts
        statut: {
          type: DataTypes.ENUM("admise", "en_cours", "clôturée"),
          defaultValue: "admise",
        },
      },
      {
        sequelize,
        modelName: "Hospitalisation",
        tableName: "hospitalisations",
        timestamps: false,
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.Patient, {
      foreignKey: "patient_id",
      as: "patient",
      onDelete: "CASCADE",
    });

    this.belongsTo(models.Utilisateur, {
      foreignKey: "medecin_id",
      as: "medecin",
      onDelete: "SET NULL",
    });

    this.belongsTo(models.Utilisateur, {
      foreignKey: "infirmier_id",
      as: "infirmier",
      onDelete: "SET NULL",
    });

    // ✅ relation billet de sortie
    this.hasOne(models.BilletSortie, {
      foreignKey: "hospitalisation_id",
      as: "billet_sortie",
      onDelete: "CASCADE",
    });
  }
}

module.exports = Hospitalisation;
