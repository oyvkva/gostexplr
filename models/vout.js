'use strict';

module.exports = (sequelize, DataTypes) => {
  const Vout = sequelize.define('Vout', {
    n: DataTypes.MEDIUMINT.UNSIGNED,
    value: DataTypes.DECIMAL(16, 8),
  }, {
    timestamps: false,
  });

  Vout.associate = function (models) {
    models.Vout.belongsToMany(models.Address, { through: 'AddressVout' });
    models.Vout.belongsToMany(models.Transaction, { through: 'TransactionVouts' });
  };

  return Vout;
};