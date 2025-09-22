const { Model, DataTypes } = require("sequelize");

class SoinInfirmier extends Model {
  static init(sequelize) {
    return super.init(
      {
        hospitalisation_id: { type: DataTypes.INTEGER },
        consultation_id: { type: DataTypes.INTEGER },
        infirmier_id: { type: DataTypes.INTEGER, allowNull: false },
        type_soin: { type: DataTypes.STRING(255), allowNull: false },
        date_soin: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        observations: { type: DataTypes.TEXT },
        statut_validation: {
          type: DataTypes.ENUM("en_attente", "valide", "rejete"),
          defaultValue: "en_attente"
        },
        remarque_medecin: { type: DataTypes.TEXT },
        medecin_id: { type: DataTypes.INTEGER }
      },
      {
        sequelize,
        modelName: "SoinInfirmier",
        tableName: "soins_infirmiers",
        timestamps: false,
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.Hospitalisation, {
      foreignKey: "hospitalisation_id",
      as: "hospitalisation",
    });
    this.belongsTo(models.Consultation, {
      foreignKey: "consultation_id",
      as: "consultation",
    });
    this.belongsTo(models.Utilisateur, {
      foreignKey: "infirmier_id",
      as: "infirmier",
    });
    this.belongsTo(models.Utilisateur, {
      foreignKey: "medecin_id",
      as: "medecin",
    });
  }
}

module.exports = SoinInfirmier;