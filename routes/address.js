var models = require('../models');
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/:address/:offset*?', async function(req, res, next) {

  const safe_address = encodeURI(req.params.address);
  const limit = 3;
  const paramPage = parseInt(req.params.offset);
  const page = isNaN(paramPage) || paramPage < 1 ? 1 : paramPage;
  const offset = limit * (page - 1);

  // const transactions = await models.Transaction.findAll({
  //   include: {
  //     model: models.Vout,
  //     include: {
  //       model: models.Address,
  //       where: {
  //         address: safe_address,
  //       },
  //     },
  //   },
  //   raw: true,
  //   offset: offset,
  //   limit: limit,
  // });

  const vouts = await models.Vout.findAll({
    raw: true,
    include: [{
      // attributes: [],
      model: models.Address,
      where: {
        address: safe_address,
      }
    }, {
      attributes: ['txid'],
      model: models.Transaction,
    }],
    // offset,
    // limit,
  });
  console.log(vouts);
  
  if (vouts === null) {
    res.status(404).render('404');
    return;
  }
  // console.log(transactions);
  const nextpage = vouts.length === 30 ? page + 1 : null;
  const prevpage = page > 1 ? page - 1 : null;

  res.render('address', {
    address: safe_address,
    vouts,
    nextpage,
    prevpage,
  });
});

module.exports = router;
