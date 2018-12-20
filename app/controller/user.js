'use strict';
const jwt = require('jsonwebtoken');
const message = require('../../config/message');
const config = require('../../config/config.default')('');
const Controller = require('egg').Controller;

class UserController extends Controller {
    async login() {
        const ctx = this.ctx;
        const { address } = ctx.request.body;

        let msg = message.returnObj('zh');
        let userId = await ctx.service.userService.login(address);

        if (userId <= 0) {
            ctx.body = msg.addressNotFound;
            return;
        }

        let content = { UserId: userId, Address: address };
        // 过期时间
        const expires = config.login.expires;
        // 生成token
        let token = jwt.sign(content, config.login.secretKey, {
            expiresIn: expires,
        });

        //下发cookies
        await ctx.cookies.set(config.keys, token);

        // 返回
        let retObj = msg.success;
        retObj.data = {
            access_token: token,
            expires_in: Math.floor(Date.now() / 1000) + expires,
            token_type: 'Bearer',
        };

        ctx.body = retObj;
    };

    async register() {
        const ctx = this.ctx;
        const { address, name } = ctx.request.body;

        let msg = message.returnObj('zh');
        let result = ctx.service.userService.register(address, name);

        ctx.body = msg.success;
    }

    async getUserInfo() {

    };

}

module.exports = UserController;