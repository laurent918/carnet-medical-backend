// models/examen.js
const { Model, DataTypes } = require("sequelize");

class Examen extends Model {
  static init(sequelize) {
    return super.init(
      {
        consultation_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        medecin_id: {
          type: DataTypes.INTEGER,
          allowNull: true, // ✅ cohérent avec ta table (peut être NULL)
        },
        laborantin_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        type_examen: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        date_prescription: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        date_examen: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        observations: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        statut: {
          type: DataTypes.ENUM("prescrit", "en_cours", "validé"),
          defaultValue: "prescrit",
        },
      },
      {
        sequelize,
        modelName: "Examen",
        tableName: "examens",
        timestamps: false,
      }
    );
  }

  static associate(models) {
    // 🔗 Consultation
    this.belongsTo(models.Consultation, {
      foreignKey: "consultation_id",
      as: "consultation",
      onDelete: "CASCADE",
    });

    // 🔗 Médecin
    this.belongsTo(models.Utilisateur, {
      foreignKey: "medecin_id",
      as: "medecin",
      onDelete: "CASCADE", // ✅ aligné avec ta table
    });

    // 🔗 Laborantin
    this.belongsTo(models.Utilisateur, {
      foreignKey: "laborantin_id",
      as: "laborantin",
      onDelete: "SET NULL", // ✅ aligné avec ta table
    });

    // 🔗 Résultats d’examen
    this.hasMany(models.ResultatExamen, {
      foreignKey: "examen_id",
      as: "resultats",
      onDelete: "CASCADE",
    });
  }
}

module.exports = Examen;
