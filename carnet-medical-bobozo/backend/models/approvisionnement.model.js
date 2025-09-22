const { Model, DataTypes } = require("sequelize");

class Approvisionnement extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        medicament_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        quantite: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        fournisseur: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        date_approvisionnement: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
        date_expiration: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        lot: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        observations: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: "Approvisionnement",
        tableName: "approvisionnements",
        timestamps: true,
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.Medicament, {
      foreignKey: "medicament_id",
      as: "medicament",
      onDelete: "CASCADE",
    });
  }
}

module.exports = Approvisionnement;
