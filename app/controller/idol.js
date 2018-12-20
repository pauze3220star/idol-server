'use strict';
const message = require('../../config/message');
const idolAttributes = require("../../config/idolAttributes");
const Controller = require('egg').Controller;

class IdolController extends Controller {
    async getIdol() {
        const ctx = this.ctx;
        const tokenId = parseInt(ctx.query.tokenId);

        let msg = message.returnObj('zh');
        let idol = await ctx.service.idolService.getIdol(tokenId, ctx.user.UserId);

        if (idol != null && idol.TokenId > 0) {

            if (idol.LikeId == null || idol.LikeId == 0)
                idol.IsLike = 0;

            let retObj = msg.success;
            retObj.data = idol;
            ctx.body = retObj;
        }
        else {
            ctx.body = msg.idolNotFound;
        }
    };

    async getMyIdols() {
        await this.getIdolList(this.ctx.user.userId);
    }

    async getMarketIdols() {
        await this.getIdolList(0);
    }

    async getIdolList(userId) {
        const ctx = this.ctx;
        const { category, hairColors, eyeColors, hairStyles, attributes, filters, sort } = ctx.query;

        const page = ctx.query.page == undefined ? 1 : parseInt(ctx.query.page);
        const pageSize = ctx.query.pageSize == undefined ? 10 : parseInt(ctx.query.pageSize);

        const limit = pageSize < 1 ? 10 : pageSize;
        const offset = (page < 1 ? 0 : page - 1) * limit;

        let idols = await ctx.service.idolService.getIdolList(userId, category, hairColors, eyeColors, hairStyles, attributes, filters, sort, offset, limit);

        ctx.body = { code: 0, message: '', data: idols };
        ctx.stats = 200;
    }

    async like() {
        const ctx = this.ctx;
        const { tokenId } = ctx.request.body;

        let msg = message.returnObj('zh');

        if (ctx.user.UserId > 0) {
            await ctx.service.idolService.like(ctx.user.UserId, tokenId);
            ctx.body = msg.success;
            return;
        }
        ctx.body = msg.noLogin;
    }

    async unlike(){
        const ctx = this.ctx;
        const { tokenId } = ctx.request.body;

        let msg = message.returnObj('zh');

        if (ctx.user.UserId > 0) {
            await ctx.service.idolService.unlike(ctx.user.UserId, tokenId);
            ctx.body = msg.success;
            return;
        }
        ctx.body = msg.noLogin;
    }
}

module.exports = IdolController;
