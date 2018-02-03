'use strict';

module.exports = (sequelize, DataTypes) => {
  const Vout = sequelize.define('Vout', {
    value: DataTypes.DECIMAL(16, 8),
  }, {
    timestamps: false,
  });

  Vout.associate = function (models) {
    models.Vout.belongsTo(models.Transaction, {
      onDelete: "CASCADE",
      foreignKey: {
        allowNull: false
      }
    });
    models.Vout.belongsToMany(models.Address, { through: 'AddressVout' });
  };

  return Vout;
};