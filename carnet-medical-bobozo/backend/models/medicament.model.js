const { Model, DataTypes } = require("sequelize");

class Medicament extends Model {
  static init(sequelize) {
    return super.init(
      {
        nom_commercial: {
          type: DataTypes.STRING(255),
          allowNull: false,
          validate: { notEmpty: { msg: "Le nom commercial ne peut pas être vide." } },
        },
        unite_nom_commercial: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        nom_dci: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        unite_nom_dci: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        forme: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        unite_forme: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        dosage: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        voie_administration: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        quantite_disponible: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          validate: { min: { args: [0], msg: "La quantité disponible ne peut pas être négative." } },
        },
        unite_quantite: {
          type: DataTypes.STRING(20),
          allowNull: true,
        },
        seuil_alerte: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 10,
          validate: { min: { args: [0], msg: "Le seuil d’alerte ne peut pas être négatif." } },
        },
        unite_seuil: {
          type: DataTypes.STRING(20),
          allowNull: true,
        },
        statut_disponibilite: {
          type: DataTypes.STRING(50),
          allowNull: false,
          defaultValue: "disponible",
        },
        date_expiration: {
          type: DataTypes.DATE,
          allowNull: true,
          validate: { isDate: { msg: "La date d'expiration doit être une date valide." } },
        },
        fournisseur: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        observations: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: "Medicament",
        tableName: "medicaments",
        timestamps: false,
      }
    );
  }
}

module.exports = Medicament;
