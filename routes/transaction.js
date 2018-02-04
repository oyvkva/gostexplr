var models = require('../models');
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/:txid', async function(req, res, next) {
  const txid = encodeURI(req.params.txid);

  const transaction = await models.Transaction.findOne({
    where: {
      txid,
    },
    include: [{
      attributes: ['hash', 'time'],
      model: models.Block,
    },{
      model: models.Vout,
      include: {
        model: models.Address,
      }
    }, {
      model: models.Transaction,
      as: 'txtx',
    }],
  });
  if (transaction === null) {
    res.status(404).render('404');
    return;
  }
  const vouts = [];
  transaction.Vouts.forEach((vout) => {
    vout.Addresses.forEach((address) => {
      vouts.push({
        address: address.address,
        value: vout.value,
      });
    });
  });
  transaction.blockTime = transaction.Block.time.toUTCString();
  res.render('transaction', {
    transaction,
    vouts,
  });
});

module.exports = router;
