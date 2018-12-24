const TronWeb = require('tronweb');
const HttpProvider = TronWeb.providers.HttpProvider;
const fullNode = 'https://api.trongrid.io';
const solidityNode = 'https://api.trongrid.io';
const eventServer = 'https://api.trongrid.io/';
const privateKey = 'da146374a75310b9666e834ee4ad0866d6f4035967bfc76217c5a495fff9f0d0';

const tronWeb = new TronWeb(
    fullNode,
    solidityNode,
    eventServer,
    privateKey
);

module.exports = {
    async getBalance() {
        const address = 'TPL66VK2gCXNCD7EJg9pgJRfqcRazjhUZY';
        const balance = await tronWeb.trx.getBalance(address);
        // await tronWeb.trx.getBalance(address, (err, balance)=>{
        //     if (err)
        //         return console.error(err);
        //     console.log(balance);
        // });
        //console.log({balance});
    },

    //客户端签名
    async signMessage(msg) {
        let hexStr = this.strToHexCharCode(msg);
        let signValue = await tronWeb.trx.signMessage(hexStr, privateKey);
        return signValue;
    },

    //服务端验证签名
    async verifyMessage(msg, signValue, address) {
        let hexStr = this.strToHexCharCode(msg);
        let ret = false;
        await tronWeb.trx.verifyMessage(hexStr, signValue, address, true, (err, res) => {
            if (!err)
                ret = true;
        });

        return ret;
    },

    strToHexCharCode(str) {
        if (str === "")
            return "";
        var hexCharCode = [];
        hexCharCode.push("0x");
        for (var i = 0; i < str.length; i++) {
            hexCharCode.push((str.charCodeAt(i)).toString(16));
        }
        return hexCharCode.join("");
    }
}