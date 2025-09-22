const { Model, DataTypes } = require("sequelize");

class Patient extends Model {
  static init(sequelize) {
    return super.init(
      {
        nom: { type: DataTypes.STRING(100), allowNull: false },
        postnom: { type: DataTypes.STRING(100) },
        prenom: { type: DataTypes.STRING(100) },
        sexe: { type: DataTypes.STRING(10), allowNull: false },
        date_naissance: { type: DataTypes.DATEONLY, allowNull: false },
        adresse: { type: DataTypes.TEXT },
        numero_dossier: { type: DataTypes.STRING(50), unique: true },
        date_enregistrement: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      },
      {
        sequelize,
        modelName: "Patient",
        tableName: "patients",
        timestamps: false,
      }
    );
  }
}

module.exports = Patient;
