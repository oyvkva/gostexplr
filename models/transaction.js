'use strict';

module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define('Transaction', {
    txid: DataTypes.STRING(64),
  }, {
    timestamps: false,
    indexes: [{
      unique: true,
      fields: ['txid']
    }],
  });

  const TxToTx = sequelize.define('TxToTx', {}, {
    timestamps: false,
  });

  Transaction.belongsToMany(Transaction, { through: TxToTx, as: 'txtx' });

  Transaction.associate = function (models) {
    models.Transaction.belongsTo(models.Block, {
      onDelete: "CASCADE",
      foreignKey: {
        allowNull: false
      }
    });

    models.Transaction.hasMany(models.Vout);
  };

  return Transaction;
};