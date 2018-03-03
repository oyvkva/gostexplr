var models = require('../models');
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/:address/:offset*?', async function(req, res, next) {

  const safe_address = encodeURI(req.params.address);
  const limit = 30;

  const transactions = await models.Transaction.findAll({
    include: {
      model: models.Vout,
      include: {
        model: models.Address,
        where: {
          address: safe_address,
        },
      },
    },
    raw: true,
    limit: 30,
  });

  console.log(transactions);
  
  if (transactions === null) {
    res.status(404).render('404');
    return;
  }

  
  const paramPage = parseInt(req.params.offset);
  const page = isNaN(paramPage) || paramPage < 1 ? 1 : paramPage;
  const offset = 30 * (page - 1);

  const nextpage = transactions.length === 30 ? page + 1 : null;
  const prevpage = page > 1 ? page - 1 : null;

  res.render('address', {
    address: safe_address,
    transactions,
    nextpage,
    prevpage,
  });
});

module.exports = router;
