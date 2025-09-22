const { Model, DataTypes } = require("sequelize");

class ResultatExamen extends Model {
  static init(sequelize) {
    return super.init(
      {
        examen_id: { type: DataTypes.INTEGER, allowNull: false },
        parametre: { type: DataTypes.STRING(255), allowNull: false },
        valeur: { type: DataTypes.STRING(255), allowNull: false },
        unite: { type: DataTypes.STRING(50) },
        interpretation: { type: DataTypes.TEXT },
      },
      {
        sequelize,
        modelName: "ResultatExamen",
        tableName: "resultats_examens",
        timestamps: false,
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.Examen, { foreignKey: "examen_id", as: "examen" });
  }
}

module.exports = ResultatExamen;
