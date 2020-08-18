const fs = require('fs')
const MobileID = artifacts.require('./MobileID.sol')

module.exports = function (deployer) {
    deployer.deploy(MobileID)
        .then(() => {
            if (MobileID._json) {
                fs.writeFile('deployedABI', JSON.stringify(MobileID._json.abi),
                    (err) => {
                    if (err) throw err;
                    console.log("파일에 ABI 입력 성공");
                    }
                )

                fs.writeFile('deployedAddress', MobileID.address,
                    (err) => {
                    if (err) throw err;
                    console.log("파일에 주소 입력 성공");
                    }
                )
            }
        })
}
