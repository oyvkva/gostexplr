var models = require('../models');
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/:address', function(req, res, next) {

  const address = encodeURI(req.params.address);

  models.Address.findOne({
    where: {
      address,
    },
    include: {
      model: models.Vout,
      include: {
        model: models.Transaction,
      },
    },
  })
  .then((address) => {
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
});

module.exports = router;
