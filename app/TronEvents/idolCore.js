const tronService = require("./tronService");

module.exports = {

    async listen(ctx) {
        let idolCore = ctx.app.config.contracts.idolCore;
        await tronService.listenEvent(idolCore, 'Transfer', this.Transfer, ctx);
        await tronService.listenEvent(idolCore, 'Pregnant', this.Pregnant, ctx);
        await tronService.listenEvent(idolCore, 'Birth', this.Birth, ctx);
    },

    //转账
    async Transfer(events, ctx) {
        console.log("监听到Ttransfer事件：", events);
        await ctx.service.idolService.Transfer(events);
    },

    //怀孕
    async Pregnant(events, ctx) {
        console.log("监听到Pregnant事件：", events);
        await ctx.service.idolService.Pregnant(events);
    },

    //出生
    async Birth(events, ctx) {
        console.log("监听到Birth事件：", events);
        await ctx.service.idolService.Birth(events);
    }
}