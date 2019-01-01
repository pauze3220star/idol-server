'use strict';
const TronWeb = require('tronweb');
const idolAttributes = require("../../config/idolAttributes");
const Service = require('egg').Service;

class IdolService extends Service {
    //ERC721中事件
    //资产转移
    //修改owner
    async Transfer(events) {
        for (var i = events.length; i > 0; i--) {
            let event = events[i - 1]; //第0个是最新的

            console.log("IdolService.Transfer, 开始处理 tokenId:" + event.result.tokenId);

            let to = TronWeb.address.fromHex("41" + event.result.to.substring(2));
            //创建拍卖，转给拍卖合约，不处理
            if (to == "TQmnHnW7yqfPrVEDLzf4RdA7W6wKiJjsXE" || to == "TKNpyPVZFzYVaERHG8RzakZNfG6yfXenG9")
                continue;

            //更新数据库
            let userId = await this.ctx.service.userService.getUserId(to);
            if (userId <= 0)
                continue;

            let affectedRows = 0;

            let sql = 'INSERT INTO translogs(`Transaction`,`Block`,`Contract`,`EventName`,`Timestamp`,`Result`,`CreateDate`) VALUES(:Transaction,:Block,:Contract,:EventName,:Timestamp,:Result,UNIX_TIMESTAMP());'
                + 'UPDATE idols SET UserId=:UserId WHERE TokenId=:TokenId AND ROW_COUNT() > 0; '; //如果set字段前后的值一样，ROW_COUNT()=0

            let trans = await this.ctx.model.transaction();
            try {
                let updates = await this.ctx.model.query(sql, {
                    raw: true,
                    model: this.ctx.model.IdolModel,
                    replacements: {
                        Transaction: event.transaction,
                        Block: event.block,
                        Contract: event.contract,
                        EventName: event.name,
                        Timestamp: event.timestamp,
                        Result: JSON.stringify(event.result),
                        UserId: userId,
                        TokenId: parseInt(event.result.tokenId)
                    },
                    transaction: trans
                });

                if (updates != null && updates.length > 0) {
                    updates.forEach(function (item, i) {
                        if (item.affectedRows == undefined || item.affectedRows == 0) {
                            return true;
                        }
                        affectedRows = affectedRows + item.affectedRows;
                    });
                }
                await trans.commit();
            }
            catch (err) {
                console.error(err);
                await trans.rollback();
            }

            //affectedRows = 0，已经处理过的事件
            //affectedRows = 2，本次transfer成功
            //affectedRows = 1，日志插入成功，但update失败，说明是新的idol产生
            if (affectedRows == 0) {
                console.log("IdolService.Transfer, tokenId: " + event.result.tokenId + ", Processed");
            }
            else if (affectedRows == 2) {
                console.log("IdolService.Transfer, tokenId: " + event.result.tokenId + ", Insert translogs success, update idols success");
            }
            else if (affectedRows == 1) { //新出生的情况，放到Birth事件里面处理
                console.log("IdolService.Transfer, tokenId: " + event.result.tokenId + ", Insert translogs success, update idols failure ");
            }
        }
    }

    //授权，暂不处理
    async Approval(events) {

    }

    //怀孕
    //处理父母的状态，修改母猫为怀孕中IsPregnant=1，修改父母猫的cooldown+1
    //event Pregnant(address owner, uint256 matronId, uint256 sireId, uint256 cooldownEndBlock);
    async Pregnant(events) {
        for (var i = events.length; i > 0; i--) {
            let event = events[i - 1]; //第0个是最新的

            console.log("IdolService.Pregnant, 开始处理 :");

            let sql = 'INSERT INTO translogs(`Transaction`,`Block`,`Contract`,`EventName`,`Timestamp`,`Result`,`CreateDate`) VALUES(:Transaction,:Block,:Contract,:EventName,:Timestamp,:Result,UNIX_TIMESTAMP());'
                + "UPDATE idols SET IsPregnant=1, SiringWithId=:sireId, CooldownIndex=CooldownIndex+1, CooldownEndBlock=:cooldownEndBlock WHERE TokenId=:matronId AND ROW_COUNT() > 0; "
                + "UPDATE idols SET CooldownIndex=CooldownIndex+1 WHERE (TokenId=:matronId OR TokenId=:sireId) AND Cooldown<13 AND ROW_COUNT() > 0 ;"; //TODO Cooldown 字段名改为CooldownIndex
            //todo，还需查询父亲的CooldownEndBlock值
            let trans = await this.ctx.model.transaction();
            try {
                await this.ctx.model.query(sql, {
                    raw: true,
                    model: this.ctx.model.IdolModel,
                    replacements: {
                        Transaction: event.transaction,
                        Block: event.block,
                        Contract: event.contract,
                        EventName: event.name,
                        Timestamp: event.timestamp,
                        Result: JSON.stringify(event.result),
                        matronId: parseInt(event.result.matronId),
                        sireId: parseInt(event.result.sireId),
                        cooldownEndBlock: parseInt(event.result.cooldownEndBlock)
                    },
                    transaction: trans
                });
                await trans.commit();
            }
            catch (err) {
                console.error(err);
                await trans.rollback();
            }
        }
    }

    //出生
    //处理母怀孕中的状态IsPregnant=0
    //插入新出生的idol
    //event Birth(address owner, uint256 kittyId, uint256 matronId, uint256 sireId, uint256 genes);
    async Birth(events) {
        for (var i = events.length; i > 0; i--) {
            let event = events[i - 1]; //第0个是最新的

            console.log("IdolService.Pregnant, 开始处理 :");

            let userId = await this.ctx.service.userService.getUserId(TronWeb.address.fromHex("41" + event.result.owner.substring(2)));
            if (userId <= 0)
                continue;

            let sql = 'INSERT INTO translogs(`Transaction`,`Block`,`Contract`,`EventName`,`Timestamp`,`Result`,`CreateDate`) VALUES(:Transaction,:Block,:Contract,:EventName,:Timestamp,:Result,UNIX_TIMESTAMP());'
                + 'INSERT INTO idols(TokenId, UserId, MatronId, SireId, Pic) SELECT :kittyId, :userId, :matronId, :sireId, "" WHERE ROW_COUNT() > 0;' //新猫出生
                + "UPDATE idols SET IsPregnant=0, SiringWithId=0, CooldownEndBlock=0 WHERE TokenId=:matronId AND ROW_COUNT() > 0; "; //母猫生育，释放出来
            //todo：还需查询新出生的BirthTime、代、cooldownIndex
            let trans = await this.ctx.model.transaction();
            try {
                await this.ctx.model.query(sql, {
                    raw: true,
                    model: this.ctx.model.IdolModel,
                    replacements: {
                        Transaction: event.transaction,
                        Block: event.block,
                        Contract: event.contract,
                        EventName: event.name,
                        Timestamp: event.timestamp,
                        Result: JSON.stringify(event.result),
                        kittyId: parseInt(event.result.kittyId),
                        userId: userId,
                        matronId: parseInt(event.result.matronId),
                        sireId: parseInt(event.result.sireId)
                    },
                    transaction: trans
                });
                await trans.commit();
            }
            catch (err) {
                console.error(err);
                await trans.rollback();
            }
        }
    }


    //SaleAuction中事件
    //拍卖创建
    //修改idol.IsForSale=1，记录拍卖的时间和价格
    async AuctionCreated(events, isSaleorRental) {
        for (var i = events.length; i > 0; i--) {
            let event = events[i - 1]; //第0个是最新的

            console.log("IdolService.AuctionCreated, 开始处理 tokenId:" + event.result.tokenId);

            let sql = 'INSERT INTO translogs(`Transaction`,`Block`,`Contract`,`EventName`,`Timestamp`,`Result`,`CreateDate`) VALUES(:Transaction,:Block,:Contract,:EventName,:Timestamp,:Result,UNIX_TIMESTAMP());'
            if (isSaleorRental == 1) //发起拍卖
                sql += 'UPDATE idols SET IsForSale=1, StartingPrice=:StartingPrice, EndingPrice=:EndingPrice, StartedAt=:StartedAt, Duration=:Duration WHERE TokenId=:TokenId AND ROW_COUNT() > 0; '; //如果set字段前后的值一样，ROW_COUNT()=0
            else
                sql += 'UPDATE idols SET IsRental=1, StartingPrice=:StartingPrice, EndingPrice=:EndingPrice, StartedAt=:StartedAt, Duration=:Duration WHERE TokenId=:TokenId AND ROW_COUNT() > 0; ';

            let trans = await this.ctx.model.transaction();
            try {
                await this.ctx.model.query(sql, {
                    raw: true,
                    model: this.ctx.model.IdolModel,
                    replacements: {
                        Transaction: event.transaction,
                        Block: event.block,
                        Contract: event.contract,
                        EventName: event.name,
                        Timestamp: event.timestamp,
                        Result: JSON.stringify(event.result),
                        TokenId: parseInt(event.result.tokenId),
                        StartingPrice: parseInt(event.result.startingPrice),
                        EndingPrice: parseInt(event.result.endingPrice),
                        StartedAt: event.timestamp / 1000,
                        Duration: parseInt(event.result.duration)
                    },
                    transaction: trans
                });
                await trans.commit();
            }
            catch (err) {
                console.error(err);
                await trans.rollback();
            }
        }
    }

    //拍卖成功
    //修改idol.IsForSale=0
    //删除记录拍卖的时间和价格
    //或者这里不处理，都放到Transfer事件中处理
    //owner的修改放到Transfer事件中处理
    async AuctionSuccessful(events, isSaleorRental) {
        for (var i = events.length; i > 0; i--) {
            let event = events[i - 1]; //第0个是最新的

            console.log("IdolService.AuctionSuccessful, 开始处理 tokenId:" + event.result.tokenId);

            let sql = 'INSERT INTO translogs(`Transaction`,`Block`,`Contract`,`EventName`,`Timestamp`,`Result`,`CreateDate`) VALUES(:Transaction,:Block,:Contract,:EventName,:Timestamp,:Result,UNIX_TIMESTAMP());'
            if (isSaleorRental == 1) //发起拍卖
                sql += 'UPDATE idols SET IsForSale=0, StartingPrice=0, EndingPrice=0, StartedAt=0, Duration=0 WHERE TokenId=:TokenId AND ROW_COUNT() > 0; '; //购买成功，IsForSale=0，修改owner address放到Transfer事件处理
            else
                sql += 'UPDATE idols SET IsRental=0, StartingPrice=0, EndingPrice=0, StartedAt=0, Duration=0 WHERE TokenId=:TokenId AND ROW_COUNT() > 0; ';

            let trans = await this.ctx.model.transaction();
            try {
                await this.ctx.model.query(sql, {
                    raw: true,
                    model: this.ctx.model.IdolModel,
                    replacements: {
                        Transaction: event.transaction,
                        Block: event.block,
                        Contract: event.contract,
                        EventName: event.name,
                        Timestamp: event.timestamp,
                        Result: JSON.stringify(event.result),
                        TokenId: parseInt(event.result.tokenId)
                    },
                    transaction: trans
                });

                await trans.commit();
            }
            catch (err) {
                console.error(err);
                await trans.rollback();
            }
        }
    }

    //拍卖取消
    //修改idol.IsForSale=0
    //删除记录拍卖的时间和价格
    async AuctionCancelled(events, isSaleorRental) {
        for (var i = events.length; i > 0; i--) {
            let event = events[i - 1]; //第0个是最新的

            console.log("IdolService.AuctionCancelled, 开始处理 tokenId:" + event.result.tokenId);

            let sql = 'INSERT INTO translogs(`Transaction`,`Block`,`Contract`,`EventName`,`Timestamp`,`Result`,`CreateDate`) VALUES(:Transaction,:Block,:Contract,:EventName,:Timestamp,:Result,UNIX_TIMESTAMP());';
            if (isSaleorRental == 1) //发起拍卖
                sql += 'UPDATE idols SET IsForSale=0, StartingPrice=0, EndingPrice=0, StartedAt=0, Duration=0 WHERE TokenId=:TokenId AND ROW_COUNT() > 0; '; //购买成功，IsForSale=0，修改owner address放到Transfer事件处理
            else //发起租赁
                sql += 'UPDATE idols SET IsRental=0, StartingPrice=0, EndingPrice=0, StartedAt=0, Duration=0 WHERE TokenId=:TokenId AND ROW_COUNT() > 0; ';

            let trans = await this.ctx.model.transaction();
            try {
                await this.ctx.model.query(sql, {
                    raw: true,
                    model: this.ctx.model.IdolModel,
                    replacements: {
                        Transaction: event.transaction,
                        Block: event.block,
                        Contract: event.contract,
                        EventName: event.name,
                        Timestamp: event.timestamp,
                        Result: JSON.stringify(event.result),
                        TokenId: parseInt(event.result.tokenId)
                    },
                    transaction: trans
                });
                await trans.commit();
            }
            catch (err) {
                console.error(err);
                await trans.rollback();
            }
        }
    }

    async setName(tokenId, name, userId) {
        let idol = await this.ctx.model.IdolModel.findOne({ where: { TokenId: tokenId, UserId: userId } });
        if (idol == null)
            return -1;

        let rtn = 0;
        await idol.update({ NickName: name }).catch(errors => {
            rtn = -2;
        });

        return rtn;
    };

    async setBio(tokenId, bio, userId) {
        let idol = await this.ctx.model.IdolModel.findOne({ where: { TokenId: tokenId, UserId: userId } });
        if (idol == null)
            return -1;

        let rtn = 0;
        await idol.update({ Bio: bio }).catch(errors => {
            rtn = -2;
        });

        return rtn;
    };

    async getIdol(tokenId, userId) {
        const ctx = this.ctx;
        let sql;
        if (userId > 0)
            sql = 'SELECT i.TokenId, NickName, i.UserId, Genes, BirthTime, Bio, Generation, Pic, Cooldown, MatronId, SireId,ul.Id AS LikeId, HairColor,EyeColor,HairStyle,LikeCount,users.Address,users.UserName, '
                //+ '(SELECT GROUP_CONCAT(Attribute) FROM idolattributes WHERE idolattributes.TokenId=i.TokenId GROUP BY TokenId) AS Attributes, ' Attributes行列转换
                //+ '(SELECT GROUP_CONCAT(Label) FROM idollabels WHERE idollabels.TokenId=i.TokenId GROUP BY TokenId) AS Labels, ' Labels行列转换
                + 'IsForSale,StartedAt,StartingPrice,EndingPrice,Duration,IsRental '
                + 'FROM idols i '
                + 'LEFT OUTER JOIN userlikes ul ON i.TokenId=ul.TokenId AND ul.UserId=:UserId '
                + 'LEFT OUTER JOIN users ON i.UserId = users.UserId '
                + 'WHERE i.TokenId=:TokenId';
        else
            sql = 'SELECT TokenId, NickName, idols.UserId, Genes, BirthTime, Bio, Generation, Pic, Cooldown, MatronId, SireId, 0 AS LikeId, HairColor,EyeColor,HairStyle,LikeCount,users.Address,users.UserName, '
                + 'IsForSale,StartedAt,StartingPrice,EndingPrice,Duration,IsRental '
                + 'FROM idols '
                + 'LEFT OUTER JOIN users ON idols.UserId = users.UserId '
                + 'WHERE TokenId=:TokenId';

        let idols = await ctx.model.query(sql, { raw: true, model: ctx.model.IdolModel, replacements: { TokenId: tokenId, UserId: userId } });
        if (idols != null && idols.length > 0) {
            let idol = idols[0];
            idol.Attributes = "smile,open mouth"; //todo
            idol.Labels = "cute,queen"; //todo
            idol.CooldownRemain = 0; //todo
            return idol;
        }
        return null;
    };

    async getIdolList(ownerUserId, userId, category, hairColors, eyeColors, hairStyles, attributes, filters, sort, offset, limit) {
        let isForSale = 0;
        let isRental = 0;

        if (category == "forsale")
            isForSale = 1;

        if (category == "rental")
            isRental = 1;

        //?category=new&sort=price&attributes=hasname,hasbio,cooldownready,dark skin,blush,smile,open mouth,hat,ribbon,glasses
        //&filters=iteration:1~2,cooldown:ur|ssr|sr|r|n,price:1~2,liked:0x834721d79edcf0851505bf47c605607030b086c1

        const ctx = this.ctx;
        let sql = 'SELECT SQL_CALC_FOUND_ROWS TokenId, NickName, UserId, Genes, BirthTime, Bio, Generation, Pic, Cooldown, MatronId, SireId, HairColor,EyeColor,HairStyle,LikeCount, '
            + 'IsForSale,StartedAt,StartingPrice,EndingPrice,Duration,IsRental '
            + 'FROM idols '
            + 'WHERE (0=:OwnerUserId OR UserId=:OwnerUserId) '
            + 'AND (0=:isForSale OR IsForSale=:isForSale) '
            + 'AND (0=:isRental OR IsRental=:isRental) ';


        //已做检查防止sql注入
        if (hairColors != undefined) {
            let sqlHairColors = "AND HairColor IN (";
            hairColors.split(",").forEach(color => {
                if (idolAttributes.HairColors.indexOf(color) >= 0) {
                    sqlHairColors += "'" + color + "',";
                }
            });
            sqlHairColors = sqlHairColors.substring(0, sqlHairColors.lastIndexOf(","));
            sqlHairColors += ") ";
            sql += sqlHairColors;
        }

        if (eyeColors != undefined) {
            let sqlEyeColors = "AND EyeColor IN (";
            eyeColors.split(",").forEach(color => {
                if (idolAttributes.EyeColors.indexOf(color) >= 0) {
                    sqlEyeColors += "'" + color + "',";
                }
            });
            sqlEyeColors = sqlEyeColors.trimRight(",");
            sqlEyeColors = sqlEyeColors.substring(0, sqlEyeColors.lastIndexOf(","));
            sqlEyeColors += ") ";
            sql += sqlEyeColors;
        }

        if (hairStyles != undefined) {
            let sqlHairStyles = "AND HairStyle IN (";
            hairStyles.split(",").forEach(style => {
                if (idolAttributes.HairStyles.indexOf(style) >= 0) {
                    sqlHairStyles += "'" + style + "',";
                }
            });
            sqlHairStyles = sqlHairStyles.substring(0, sqlHairStyles.lastIndexOf(","));
            sqlHairStyles += ") ";
            sql += sqlHairStyles;
        }

        let attrs;
        let cooldownready = 0; //冷却就绪
        let hasname = 0; //已命名
        let hasbio = 0; //已有简介
        let characteristics = new Array(); //特征

        if (attributes != undefined) {
            attrs = attributes.split(",");
            for (var i = 0; i < attrs.length; i++) {
                if (attrs[i] == "cooldownready") {
                    cooldownready = 1;
                    continue;
                }

                if (attrs[i] == "hasname") {
                    hasname = 1;
                    continue;
                }
                if (attrs[i] == "hasbio") {
                    hasbio = 1;
                    continue;
                }

                if (idolAttributes.Attributes.indexOf(attrs[i]) >= 0) {
                    characteristics.push(attrs[i]);
                    continue;
                }
            }
        }

        //todo cooldownready 数据库需要记录上次生育时间
        //cooldownEndBlock secondsPerBlock

        if (hasname === 1) {
            sql += " AND NickName IS NOT NULL AND NickName<>'' "
        }

        if (hasbio === 1) {
            sql += " AND Bio IS NOT NULL AND Bio<>'' "
        }

        //todo characteristics 特征


        //代，冷却速度，价格，like
        if (filters != undefined) {
            let conditions = filters.split(",");

            let iterationStart = 0;
            let iterationEnd = 999999
            let cooldowns; //冷却速度
            let priceStart = 0;
            let priceEnd;
            let likeAddress;
            let name;

            for (var i = 1; i < conditions.length; i++) {
                var conditionX = conditions[i].split(":");
                switch (conditionX[0]) {
                    case "iteration":
                        let iterations = conditionX[1].split("~");
                        iterationStart = parseInt(iterations[0]);
                        iterationEnd = iterations.length > 1 ? parseInt(iterations[1]) : 999999;
                        break;
                    case "cooldown":
                        cooldowns = conditionX[1].split("|");
                        break;
                    case "price":
                        let prices = conditionX[1].split("~");
                        priceStart = parseFloat(prices[0]);
                        if (prices.length > 1) {
                            priceEnd = parseFloat(prices[1]);
                        }
                        break;
                    case "liked":
                        likeAddress = conditionX[1];
                        break;
                    case "name":
                        name = conditionX[1];
                        break;
                }
            }

            //代
            sql += " AND Generation>=" + iterationStart + " AND Generation<=" + iterationEnd; //已做整形转换，防止sql注入

            //冷却速度
            if (cooldowns != undefined) {
                let sqlCooldowns = " AND Cooldown in ("
                cooldowns.forEach(cooldown => {
                    let index = idolAttributes.Cooldowns.indexOf(cooldown);
                    if (index >= 0) {
                        sqlCooldowns += index + ",";
                    }
                });
                sqlCooldowns = sqlCooldowns.substring(0, sqlCooldowns.lastIndexOf(","));
                sqlCooldowns += ") ";
                sql += sqlCooldowns;
            }

            //价格

            //昵称name
            if (name != undefined) {
                sql += " AND NickName=:NickName ";
            }
        }

        //排序
        switch (sort) {
            case "id":
                sql += ' ORDER BY TokenId ';
                break;
            case "-id":
                sql += ' ORDER BY TokenId DESC ';
                break;

            case "iteration":
                sql += ' ORDER BY CreateDate ';
                break;
            case "-iteration":
                sql += ' ORDER BY CreateDate DESC ';
                break;

            //价格

            case "name":
                sql += ' ORDER BY NickName ';
                break;
            case "-name":
                sql += ' ORDER BY NickName DESC ';
                break;

            case "cooldown":
                sql += ' ORDER BY Cooldown ';
                break;
            case "-liked":  //人气，like点赞数量
                sql += ' ORDER BY LikeCount DESC ';
                break;
            case "newauction": //追加时间
                sql += ' ORDER BY CreateDate DESC ';
                break;
        }

        sql += 'LIMIT :offset, :limit; ';
        sql += 'SELECT FOUND_ROWS() AS Counts; ';
        let dbset = await ctx.model.query(sql, {
            raw: true, model: ctx.model.IdolModel, replacements:
                {
                    OwnerUserId: ownerUserId, UserId: userId, isForSale, isRental, offset, limit
                }
        });

        // if (idols != null)
        //     idols.forEach(idol => {
        //         idol.Attributes = "smile,open mouth";
        //         idol.Labels = "cute,queen";
        //     });

        let idols = [];
        let count = 0;
        let tokenIds = "";
        if (dbset != null) {
            for (let idolIndex in dbset[0]) {
                let idol = dbset[0][idolIndex];
                idol.IsLike = 0;
                idols.push(idol); //属性
                tokenIds += idol.TokenId + ",";
            }
            count = dbset[1][0].Counts;
        }

        //查询是否点赞
        if (tokenIds !== "" && userId > 0) {
            tokenIds = tokenIds.substring(0, tokenIds.lastIndexOf(","));
            let sqlLikes = "SELECT Id,TokenId FROM userlikes WHERE UserId=:UserId AND TokenId IN(" + tokenIds + ");";
            let likes = await ctx.model.query(sqlLikes, { raw: true, model: ctx.model.UserLikeModel, replacements: { UserId: userId } });
            if (likes != null) {
                likes.forEach(like => {
                    for (var i = 0; i < idols.length; i++) {
                        if (like.TokenId == idols[i].TokenId) {
                            idols[i].IsLike = 1;
                            break;
                        }
                    }
                });
            }
        }

        let retObj = {
            count: count,
            rows: idols
        };

        return retObj;
    }

    async like(userId, tokenId) {
        let sql = 'UPDATE idols SET LikeCount=LikeCount+1 WHERE TokenId=:TokenId AND NOT EXISTS ( SELECT 1 FROM userlikes WHERE TokenId=:TokenId AND UserId=:UserId); '
            + 'INSERT INTO userlikes (UserId, TokenId, CreateDate) '
            + ' SELECT :UserId, :TokenId, UNIX_TIMESTAMP() FROM DUAL WHERE ROW_COUNT() > 0;';

        let affectedRows = 0;
        let trans = await this.ctx.model.transaction();
        try {
            let updates = await this.ctx.model.query(sql, {
                raw: true,
                model: this.ctx.model.IdolModel,
                replacements: { UserId: userId, TokenId: tokenId },
                transaction: trans
            });

            if (updates != null && updates.length > 0) {
                updates.forEach(function (item, i) {
                    if (item.affectedRows == undefined || item.affectedRows == 0) {
                        return true;
                    }
                    affectedRows = affectedRows + item.affectedRows;
                });
            }
            await trans.commit();
        }
        catch (err) {
            console.error(err);
            await trans.rollback();
        }
        return affectedRows;
    }

    async unlike(userId, tokenId) {
        let sql = 'DELETE FROM userlikes WHERE TokenId=:TokenId AND UserId=:UserId; '
            + 'UPDATE idols SET LikeCount=LikeCount-1 WHERE TokenId=:TokenId AND ROW_COUNT() > 0;';

        let affectedRows = 0;
        let trans = await this.ctx.model.transaction();
        try {
            let updates = await this.ctx.model.query(sql, {
                raw: true,
                model: this.ctx.model.IdolModel,
                replacements: { UserId: userId, TokenId: tokenId },
                transaction: trans
            });

            if (updates != null && updates.length > 0) {
                updates.forEach(function (item, i) {
                    if (item.affectedRows == undefined || item.affectedRows == 0) {
                        return true;
                    }
                    affectedRows = affectedRows + item.affectedRows;
                });
            }
            await trans.commit();
        }
        catch (err) {
            console.error(err);
            await trans.rollback();
        }
        return affectedRows;
    }

}

module.exports = IdolService;