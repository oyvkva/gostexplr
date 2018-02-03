'use strict';

module.exports = (sequelize, DataTypes) => {
  const Failure = sequelize.define('Failure', {
    msg: DataTypes.STRING,
  }, {
    timestamps: true,
    updatedAt: false,
  });

  return Failure;
};