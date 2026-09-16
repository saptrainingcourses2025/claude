const bcrypt = require('bcryptjs');

const BCRYPT_COST = 10;

module.exports = {
    hash: (plain) => bcrypt.hash(plain, BCRYPT_COST),
    compare: (plain, hash) => bcrypt.compare(plain, hash),
};
