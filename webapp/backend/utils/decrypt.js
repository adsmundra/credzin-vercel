const crypto = require("crypto");

const decrypt = (encryptedText) => {
  const algorithm = "aes-256-cbc";
  // Ensure the key derivation is identical to the encryption method
  const key = crypto
    .createHash('sha256')
    .update(String(process.env.ENCRYPTION_KEY))
    .digest();

  // Split the text into IV and the encrypted data
  const textParts = encryptedText.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedData = Buffer.from(textParts.join(':'), 'hex');
  
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedData);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString();
};

module.exports = decrypt;