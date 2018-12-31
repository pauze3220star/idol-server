
const idolCore = require("./idolCore");
const saleAuction = require("./saleAuction");
const siringAuction = require("./siringAuction");
//require("./saleAuction");
//require("./siringAuction");

//let lastBlock = parseInt(RecordLastBlock.read());
//if (last)
module.exports = {

    async listen(ctx) {
        await idolCore.listen(ctx);
        await saleAuction.listen(ctx);
        await siringAuction.listen(ctx);
    }
}