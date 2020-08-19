const NodeRSA = require('node-rsa');

let key = new NodeRSA({b: 2048});

const RSA = {};

RSA.encrypt = function (text) {
    return key.encrypt(text, `base64`);
};

RSA.decrypt = function (cipherText) {
    return key.decrypt(cipherText, 'utf8');
};

RSA.getKey = function () {
    return key;
};

RSA.getPublicKey = function () {
    return key.exportKey('pkcs8-public-pem');
}

RSA.getPrivateKey = function () {
    return key.exportKey('pkcs8-private-pem');
}


RSA.encryptData = function (privateKey, userData) {
    return key.encryptPrivate(userData, 'base64');
}

module.exports = RSA;