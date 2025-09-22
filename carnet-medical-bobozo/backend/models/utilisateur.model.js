const { Model, DataTypes } = require("sequelize");

class Utilisateur extends Model {
  static init(sequelize) {
    return super.init(
      {
        noms: { type: DataTypes.STRING(255), allowNull: false },
        matricule: { type: DataTypes.STRING(255) },
        grade: { type: DataTypes.STRING(255) },
        fonction: { type: DataTypes.STRING(255) },
        service: { type: DataTypes.STRING(255) },
        email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
        mot_de_passe: { type: DataTypes.STRING(255), allowNull: false },
        role: { type: DataTypes.STRING(50) },
        photo: { type: DataTypes.STRING(255) },
        observation: { type: DataTypes.TEXT },
        statut: { type: DataTypes.STRING(20), defaultValue: "actif" },
        date_creation: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      },
      {
        sequelize,
        modelName: "Utilisateur",
        tableName: "utilisateurs",
        timestamps: false,
      }
    );
  }
}

module.exports = Utilisateur;
