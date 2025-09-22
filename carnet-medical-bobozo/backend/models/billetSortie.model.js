const { Model, DataTypes } = require("sequelize");

class BilletSortie extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        hospitalisation_id: { 
          type: DataTypes.INTEGER, 
          allowNull: false, 
          unique: true // 🚫 Un seul billet par hospitalisation
        },
        medecin_id: { type: DataTypes.INTEGER, allowNull: true },
        date_sortie: { type: DataTypes.DATEONLY, allowNull: false },
        motif_sortie: { type: DataTypes.STRING, allowNull: true },
        etat_patient_sortie: { type: DataTypes.STRING, allowNull: true },
        signature_agent: { type: DataTypes.STRING, allowNull: true },
      },
      {
        sequelize,
        modelName: "BilletSortie",
        tableName: "billets_sortie",
        timestamps: false,
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.Hospitalisation, {
      foreignKey: "hospitalisation_id",
      as: "hospitalisation",
      onDelete: "CASCADE",
    });

    this.belongsTo(models.Utilisateur, {
      foreignKey: "medecin_id",
      as: "medecin",
      onDelete: "SET NULL",
    });
  }
}

module.exports = BilletSortie;
