const NodeRSA = require('node-rsa');

let key = new NodeRSA();

const RSA = {};

RSA.encrypt = function (text) {
    return key.encrypt(text, `base64`);
};

RSA.decrypt = function (cipherText) {
    return key.decrypt(cipherText, 'utf8');
};

RSA.getKey = function () {
    key = new NodeRSA({b: 512});
    return key;
};

RSA.getPublicKey = function () {
    return key.exportKey('pkcs8-public-pem');
}

RSA.getPrivateKey = function () {
    return key.exportKey('pkcs8-private-pem');
}


RSA.encryptData = function (privateKey, userData) {
    key = new NodeRSA(privateKey,'pkcs8-private-pem');
    return key.encryptPrivate(userData, 'base64');
}

RSA.decryptData = function (publicKey, userData) {
    key = new NodeRSA(publicKey, 'pkcs8-public-pem');
    return key.decryptPublic(userData, 'utf8');
}

RSA.sign = function (privateKey, userData) {
    key = new NodeRSA(privateKey,'pkcs8-private-pem');
    return key.sign(userData, 'hex', 'utf8');
}

module.exports = RSA;
