var http = require('http');
var models = require('../models');
var rpcConfig = require('../config/config')['rpc'];

const {username, password, hostname, port} = rpcConfig;

function MakeRPCRequest(postData) {
  return new Promise(function(resolve, reject) {
    var post_options = {
      host: hostname,
      port: port,
      auth: `${username}:${password}`,
      path: '/',
      method: 'POST',
      headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData)
      }
    };
    var post_req = http.request(post_options, function(res) {
      res.setEncoding("utf8");
      let body = "";
      res.on("data", data => {
        body += data;
      });
      res.on("end", () => {
        resolve(body);
      });
    });
    post_req.write(postData);
    post_req.end();
  });
}

// async function saveTransaction(txid, blockHeight) {
async function saveTransaction(txid, blockHeight) {
  const res_tx = await MakeRPCRequest(JSON.stringify({
    method: 'getrawtransaction',
    params: [txid, 1],
    id: 1
  }));
  const tx = JSON.parse(res_tx)['result'];
  if (tx === null) {
    await models.Failure.create({
      msg: `Transaction ${txid} fetching failed`,
    });
    return;
  }
  // const transaction = await models.Transaction.create({
  //   txid: tx.txid,
  //   BlockHeight: blockHeight,
  // });
  const transaction = {
    txid: tx.txid,
    BlockHeight: blockHeight,
    vouts: [],
    vins: [],
  };

  // Loop over vouts
  for (var i = 0; i < tx.vout.length; i++) {
    const vout = tx.vout[i];
    const m_vout = {
      n: vout.n,
      value: vout.value,
      addresses: [],
      direction: 1,
    };
    // Loop over addresses in vout
    for (var y = 0; y < vout.scriptPubKey.addresses.length; y++) {
      const address = vout.scriptPubKey.addresses[y];
      m_vout.addresses.push(address);
    }
    transaction.vouts.push(m_vout); // TODO create
  }
  for (var i = 0; i < tx.vin.length; i++) {
    const vin = tx.vin[i];
    if (vin.txid) {
      transaction.vins.push(vin); 
    }
  }
  return transaction;
}

async function createBlock(block) {
  return models.sequelize.transaction().then(async (t) => {
    try {
      console.log(1)
      const m_block = await models.Block.create(Object.assign({}, block, {transaction: t}));
      for (var i = block.tx.length - 1; i >= 0; i--) {
        tx = block.tx[i];
        if (!tx) continue; // for genesis block
        console.log(2)
        const m_transaction = await models.Transaction.create({
          txid: tx.txid,
          BlockHeight: tx.BlockHeight,
          transaction: t,
        });
        console.log(2.1, m_transaction.id, m_block.height) 
        await m_block.addTransaction(m_transaction, t);
        console.log(2.2)
        for (var y = tx.vouts.length - 1; y >= 0; y--) {
          const vout = tx.vouts[y];
          console.log(3)
          const m_vout = await models.Vout.create({
            n: vout.n,
            value: vout.value,
            direction: 1,
            transaction: t,
          });
          console.log(4)
          await m_transaction.addVouts(m_vout, {
            through: {
              direction: 1
            },
            transaction: t,
          });
          for (var z = vout.addresses.length - 1; z >= 0; z--) {
            const address = vout.addresses[z];
            console.log(5)
            let m_address = await models.Address.findOne({
              where: {
                address,
              },
            });
            if (!m_address) {
              console.log(6)
              m_address = await models.Address.create({
                address,
                transaction: t,
              }, t);
            }
            console.log(7)
            await m_vout.addAddress(m_address);
          }
        }
        for (var y = tx.vins.length - 1; y >= 0; y--) {
          const vin = tx.vins[y];
          if (vin.txid) {
            console.log(8)
            const vout = await models.Vout.findAll({
              include: {
                model: models.Transaction,
                where: {
                  txid: vin.txid,
                },
              },
              where: {
                n: vin.vout,
              },
            });
            if (vout) {
              console.log(9)
              await m_transaction.addVouts(vout[0], { 
                through: { 
                  direction: 0, 
                }, 
                transaction: t, 
              });
            } else {
              throw('Couldnt find vout for VIN');
            }
          }
        }
      }
      t.commit();
    } catch (e) {
      t.rollback();
      console.log('===', e, 'error');
    }
  });
}

async function syncNextBlock(syncedHeight) {
  const height = syncedHeight + 1;
  const res_hash = await MakeRPCRequest(JSON.stringify({
    method: 'getblockhash',
    params: [height],
    id: 1
  }));
  const blockHash = JSON.parse(res_hash)['result'];
  const res_block = await MakeRPCRequest(JSON.stringify({
    method: 'getblock',
    params: [blockHash],
    id: 1
  }));
  const block = JSON.parse(res_block)['result'];
  block.time = new Date(block.time * 1000);

  const blockToCreate = Object.assign({}, block, {'tx': []});
  for (var i = 0; i < block.tx.length; i++) {
    tx = await saveTransaction(block.tx[i], block.height);
    blockToCreate.tx.push(tx);
  }
  if (blockToCreate.height > 1) {
    await models.Block.update({
      nextblockhash: block.hash
    },{
      where: {
        hash: block.previousblockhash
      }
    });
  }
  await createBlock(blockToCreate);
  return height;
}

async function getCurrentHeight() {
  const result = await MakeRPCRequest(JSON.stringify({
    method: 'getblockcount',
    params: [],
    id: 1
  }));

  return JSON.parse(result)['result'];
}

async function getSyncedHeight() {
  const result = await models.Block.findOne({
    attributes: ['height'],
    order: [['height', 'DESC']],
    limit: 1
  });
  const height = result ? result.height : -1;
  return height;
}

async function syncBlockchain() {
  let syncedHeight = await getSyncedHeight();
  console.log('\x1b[36m%s\x1b[0m', 'syncedHeight is', syncedHeight);

  let currentHeight = await getCurrentHeight();
  console.log('\x1b[36m%s\x1b[0m', 'currentHeight is', currentHeight);
  try {
    while (syncedHeight < currentHeight) {
      syncedHeight = await syncNextBlock(syncedHeight);
      // process.stdout.write(`Synced ${syncedHeight} out of ${currentHeight}\r`);
      console.log(`Synced ${syncedHeight} out of ${currentHeight}`);
      if (syncedHeight >= 125) 
        process.exit(0)
    }
  } catch (e) {
    console.log('+====', e);
    process.exit(0);
  }
  process.stdout.write('\nDone\n');
  process.exit(0);
}

syncBlockchain()
 .then((res) => process.exit(0));
