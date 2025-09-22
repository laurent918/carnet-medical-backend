const { Model, DataTypes } = require("sequelize");

class ConstanteVitale extends Model {
  static init(sequelize) {
    return super.init(
      {
        tension_arterielle: DataTypes.STRING, // ex: "120/80"
        pouls: DataTypes.INTEGER,
        temperature: DataTypes.FLOAT,
        frequence_respiratoire: DataTypes.INTEGER,
        glycemie: DataTypes.FLOAT,
        spo2: DataTypes.INTEGER, // saturation oxygène %
        observations: DataTypes.TEXT,
        date_mesure: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
      },
      { sequelize, modelName: "ConstanteVitale", tableName: "constantes_vitales" }
    );
  }

  static associate(models) {
    // 🔹 Chaque constante appartient à une hospitalisation
    this.belongsTo(models.Hospitalisation, {
      foreignKey: "hospitalisation_id",
      as: "hospitalisation",
      onDelete: "CASCADE",
    });

    // 🔹 Chaque constante est saisie par un infirmier (utilisateur)
    this.belongsTo(models.Utilisateur, {
      foreignKey: "infirmier_id",
      as: "infirmier",
      onDelete: "SET NULL",
    });
  }
}

module.exports = ConstanteVitale;