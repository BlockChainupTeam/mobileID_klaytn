const crypto = require('crypto');

const AESCrypt = {};

AESCrypt.encrypt = function(key, plainData) {
    const iv = crypto.randomBytes(16);


    let encipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv),
        encrypted = encipher.update(plainData);

    encrypted = Buffer.concat([encrypted, encipher.final()]);

    return {
        iv: iv.toString('hex'),
        encryptedData: encrypted.toString('hex')
    };
};

AESCrypt.decrypt = function(text, key) {
    let iv = Buffer.from(text.iv, 'hex');
    let encryptedText = Buffer.from(text.encryptedData ,'hex')

    let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);

    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
};

module.exports = AESCrypt;