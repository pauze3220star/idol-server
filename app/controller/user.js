'use strict';
const jwt = require('jsonwebtoken');
const message = require('../../config/message');
const tronService = require("../TronEvents/tronService");
const Controller = require('egg').Controller;

class UserController extends Controller {
    async login() {
        const ctx = this.ctx;
        const { address, timestamp, sign } = ctx.request.body;
        let msg = message.returnObj('zh');

        let signMessage = "address=" + address + "&timestamp=" + timestamp;
        if (!await tronService.verifyMessage(signMessage, sign, address)) { //签名验证失败
            ctx.body = msg.signError;
            return;
        }

        let userId = await ctx.service.userService.login(address);
        if (userId <= 0) {
            ctx.body = msg.addressNotFound;
            return;
        }

        let content = { UserId: userId, Address: address };
        // 过期时间
        const expires = this.config.login.expires;
        // 生成token
        let token = jwt.sign(content, this.config.login.secretKey, {
            expiresIn: expires,
        });

        //下发cookies
        await ctx.cookies.set(this.config.keys, token);

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
        const { address, name, timestamp, sign } = ctx.request.body;
        let msg = message.returnObj('zh');

        let signMessage = "address=" + address + "&timestamp=" + timestamp;
        if (!await tronService.verifyMessage(signMessage, sign, address)) { //签名验证失败
            ctx.body = msg.signError;
            return;
        }

        let result = await ctx.service.userService.register(address, name);
        if (result)
            ctx.body = msg.success;
        else
            ctx.body = msg.registerError;
    }

    async initIdol() {
        let msg = message.returnObj('zh');
        await tronService.initData(this.ctx);
        this.ctx.body = msg.success;
    }

    async initAuction() {
        let idols = await this.service.idolService.getAuctionIdols();
        await idols.forEach(async idol => {
            if (idol.UserId == 27) //拍卖合约
            {
                let auction = await tronService.getAuction(idol.TokenId);
                await this.service.idolService.updateAuction(idol.TokenId, auction, 1);
            }
            else { //租赁合约
                
            }
        });

        let msg = message.returnObj('zh');
        this.ctx.body = msg.success;
    }

    async trontest() {
        const tokenId = this.ctx.request.body.tokenId;
        let a = await tronService.ownerOf(1);
        let b = await tronService.getKitty(tokenId);

        let auction1 = await tronService.bid(tokenId);

        let auction = await tronService.getAuction(tokenId);

        this.ctx.body = auction;
    }

    async signtest() {
        var timestamp = Math.round(new Date().getTime() / 1000);
        let address = 'TPL66VK2gCXNCD7EJg9pgJRfqcRazjhUZY';
        let signMessage = "address=" + address + "&timestamp=" + timestamp;
        let sign = await tronService.signMessage(signMessage);

        this.ctx.body = {
            "address": 'TPL66VK2gCXNCD7EJg9pgJRfqcRazjhUZY',
            "timestamp": timestamp,
            "signMessage": signMessage,
            "sign": sign
        };
    }

    async getUserInfo() {

        // await tronService.getBalance();
        // const str1 = "tron idol 111";
        // const str2 = "tron idol 222";

        // const address1 = "TPL66VK2gCXNCD7EJg9pgJRfqcRazjhUZY";
        // const address2 = "TVjmtiAVdbox9LYtZ7eu8Bq7mHJFZCZ3dg";

        // let signValue = await tronService.signMessage(str1);
        // let a = await tronService.verifyMessage(str1, signValue, address1);
        // let b = await tronService.verifyMessage(str2, signValue, address1);
        // let c = await tronService.verifyMessage(str1, signValue, address2);

        // console.log("a=" + a);
        // console.log("b=" + b);
        // console.log("c=" + c);
    };

}

module.exports = UserController;