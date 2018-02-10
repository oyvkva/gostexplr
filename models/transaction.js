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

  const TransactionVouts = sequelize.define('TransactionVouts', {
    'direction': DataTypes.TINYINT(1),
  }, {
    timestamps: false,
  });

  Transaction.associate = function (models) {
    models.Transaction.belongsTo(models.Block, {
      onDelete: "CASCADE",
      foreignKey: {
        allowNull: false
      },
    });

    models.Transaction.belongsToMany(models.Vout, { through: 'TransactionVouts' });
  };

  return Transaction;
};