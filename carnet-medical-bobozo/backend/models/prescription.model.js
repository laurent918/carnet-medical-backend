const { Model, DataTypes } = require("sequelize");

class Prescription extends Model {
  static init(sequelize) {
    return super.init(
      {
        consultation_id: { 
          type: DataTypes.INTEGER, 
          allowNull: false 
        },
        pharmacien_id: { 
          type: DataTypes.INTEGER 
        },
        
        // ✅ Optionnel car on peut saisir un nom libre
        medicament_id: { 
          type: DataTypes.INTEGER, 
          allowNull: true 
        },
        medicament_nom: { 
          type: DataTypes.STRING(255), 
          allowNull: true 
        },

        posologie: { 
          type: DataTypes.STRING(255), 
          allowNull: false 
        },
        duree: { 
          type: DataTypes.STRING(100), 
          allowNull: false 
        },
        observations: { 
          type: DataTypes.TEXT 
        },

        // ✅ Harmonisation des statuts
        statut: {
          type: DataTypes.ENUM("en_attente", "délivrée"),
          defaultValue: "en_attente",
        },

        // ✅ Nouvelle colonne : quantité prescrite
        quantite_prescrite: { 
          type: DataTypes.INTEGER, 
          allowNull: false,
          defaultValue: 1 
        },

        // ✅ Toujours gérée par le pharmacien
        quantite_delivree: { 
          type: DataTypes.INTEGER, 
          allowNull: false,
          defaultValue: 0 
        }
      },
      {
        sequelize,
        modelName: "Prescription",
        tableName: "prescriptions",
        timestamps: false,
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.Consultation, { 
      foreignKey: "consultation_id", 
      as: "consultation" 
    });
    this.belongsTo(models.Utilisateur, { 
      foreignKey: "pharmacien_id", 
      as: "pharmacien" 
    });

    // ✅ Association avec Medicament
    this.belongsTo(models.Medicament, { 
      foreignKey: "medicament_id", 
      as: "medicament" 
    });
  }
}

module.exports = Prescription;