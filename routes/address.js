var models = require('../models');
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/:address', async function(req, res, next) {

  const addrss = encodeURI(req.params.address);

  const address = await models.Address.findOne({
    where: {
      address: addrss,
    },
    include: {
      model: models.Vout,
      include: {
        model: models.Transaction,
      },
    },
  });

  if (address === null) {
    res.status(404).render('404');
    return;
  }
  const txes = [];
  address.Vouts.forEach((vout) => txes.push(vout.Transaction.txid));
  res.render('address', {
    address: address.address,
    txes,
  });
});

module.exports = router;
