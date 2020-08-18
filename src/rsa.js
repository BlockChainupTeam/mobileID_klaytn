const NodeRSA = require('node-rsa');

const key= new NodeRSA({b: 512});
const RSA = {};


RSA.encrypt = function (text) {
    return key.encrypt(text, `base64`);
};

RSA.decrypt = function (cipherText) {
    return key.decrypt(cipherText, 'utf8');
};

RSA.getKeyPair = function () {
    return key;
};

RSA.getPublicKey = function () {
    return key.exportKey('pkcs8-public-pem');
}

RSA.getPrivateKey = function () {
    return key.exportKey('pkcs8-private-pem');
}

module.exports = RSA;
//
// module.exports.encrypt = encrypt;
// module.exports.decrypt = decrypt;
// module.exports.getKeyPair = getKeyPair;
// module.exports.getPublicKey = getPublicKey;