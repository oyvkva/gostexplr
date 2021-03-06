'use strict';
module.exports = (sequelize, DataTypes) => {
  const Block = sequelize.define('Block', {
  	height: {
    	type: DataTypes.INTEGER.UNSIGNED,
    	primaryKey: true,
    },
    hash: DataTypes.STRING(64),
    size: DataTypes.MEDIUMINT.UNSIGNED,
    version: DataTypes.TINYINT.UNSIGNED,
    merkleroot: DataTypes.STRING(64),
    time: DataTypes.DATE,
    nonce: DataTypes.BIGINT,
    bits: DataTypes.STRING(8),
    difficulty: DataTypes.DECIMAL(16, 8),
    previousblockhash: DataTypes.STRING(64),
    nextblockhash: DataTypes.STRING(64),
  }, {
  	timestamps: false,
    indexes: [{
    	unique: true,
    	fields: ['hash', 'height']
    }],
    freezeTableName: true,
  });

  Block.associate = function(models) {
    models.Block.hasMany(models.Transaction);
  };

  return Block;
};
