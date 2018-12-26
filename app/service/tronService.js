'use strict';
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
    async signMessage(message) {
        let hexStr = this.strToHex(message);
        let sign = await tronWeb.trx.signMessage(hexStr, privateKey);
        return sign;
    },

    //服务端验证签名
    async verifyMessage(message, sign, address) {

        // tronWeb.getEventResult('TKexVE6nKujFaLZeAQh8YRVXda3gjpX1sV', 'Notify', 32162, (err, events) => {
        //     if(err)
        //         return console.error(err);
    
        //     console.group('Event result');
        //         console.log('Contract Address: TKexVE6nKujFaLZeAQh8YRVXda3gjpX1sV');
        //         console.log('Event Name: Notify');
        //         console.log('Block Number: 32162');
        //         console.log('- Events:\n' + JSON.stringify(events, null, 2), '\n');
        //     console.groupEnd();
        // });
    
        await tronWeb.getEventByTransactionID('2fb0c22a94ac4371303d8639d5b837232f38fb23f1a4bd2e09d2e242b7301656', (err, events) => {
            if(err)
                return console.error(err);
    
            console.group('Specific event result');
                console.log('Transaction: 2fb0c22a94ac4371303d8639d5b837232f38fb23f1a4bd2e09d2e242b7301656');
                console.log('- Events:\n' + JSON.stringify(events, null, 2), '\n');
            console.groupEnd();
        });

        return true;
        let hexStr = this.strToHex(message);
        let ret = false;
        await tronWeb.trx.verifyMessage(hexStr, sign, address, true, (err, res) => {
            if (!err)
                ret = true;
        });

        return ret;
    },

    strToHex(str) {
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