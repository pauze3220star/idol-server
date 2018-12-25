'use strict';
const idolAttributes = require("../../config/idolAttributes");
const Service = require('egg').Service;

class IdolService extends Service {

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
            sql = 'SELECT i.TokenId, NickName, i.UserId, Genes, BirthTime, Bio, Generation, Pic, Cooldown, MatronId, SireId,ul.Id AS LikeId, HairColor,EyeColor,HairStyle,LikeCount,users.Address,users.UserName '
                + 'FROM idols i '
                + 'LEFT OUTER JOIN userlikes ul ON i.TokenId=ul.TokenId AND ul.UserId=:UserId '
                + 'LEFT OUTER JOIN users ON i.UserId = users.UserId '
                + 'WHERE i.TokenId=:TokenId';
        else
            sql = 'SELECT TokenId, NickName, idols.UserId, Genes, BirthTime, Bio, Generation, Pic, Cooldown, MatronId, SireId, 0 AS LikeId, HairColor,EyeColor,HairStyle,LikeCount,users.Address,users.UserName '
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

    async getIdolList(userId, category, hairColors, eyeColors, hairStyles, attributes, filters, sort, offset, limit) {
        let isForSale = 0;
        let isRental = 0;

        if (category == "forsale")
            isForSale = 1;

        if (category == "rental")
            isRental = 1;

        //?category=new&sort=price&attributes=hasname,hasbio,cooldownready,dark skin,blush,smile,open mouth,hat,ribbon,glasses
        //&filters=iteration:1~2,cooldown:ur|ssr|sr|r|n,price:1~2,liked:0x834721d79edcf0851505bf47c605607030b086c1

        const ctx = this.ctx;
        let sql = 'SELECT SQL_CALC_FOUND_ROWS TokenId, NickName, UserId, Genes, BirthTime, Bio, Generation, Pic, Cooldown, MatronId, SireId, HairColor,EyeColor,HairStyle,LikeCount '
            + 'FROM idols '
            + 'WHERE (0=:UserId OR UserId=:UserId) '
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

        //todo 待验证
        if (hasname === 1) {
            sql += " AND NickName IS NOT NULL "
        }

        //todo 待验证
        if (hasbio === 1) {
            sql += " AND Bio IS NOT NULL "
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
        let dbset = await ctx.model.query(sql, { raw: true, model: ctx.model.IdolModel, model: ctx.model.Counts, replacements: { UserId: userId, isForSale, isRental, offset, limit } });

        // if (idols != null)
        //     idols.forEach(idol => {
        //         idol.Attributes = "smile,open mouth";
        //         idol.Labels = "cute,queen";
        //     });

        let idols = [];
        let count = 0;
        if (dbset != null) {
            for (let idol in dbset[0]) {
                idols.push(dbset[0][idol]); //属性
                //arr.push(obj[i]); //值
            }

            count = dbset[1][0].Counts;
        }

        let retObj = {
            count: count,
            rows: idols
        };

        return retObj;
    }

    async like(userId, tokenId) {
        let sql = 'START TRANSACTION; '
            + 'UPDATE idols SET LikeCount=LikeCount+1 WHERE TokenId=:TokenId AND NOT EXISTS ( SELECT 1 FROM userlikes WHERE TokenId=:TokenId AND UserId=:UserId); '
            + 'INSERT INTO userlikes (UserId, TokenId, CreateDate) '
            + ' SELECT :UserId, :TokenId, UNIX_TIMESTAMP() FROM DUAL WHERE ROW_COUNT() > 0;'
            + 'COMMIT';
        let updates = await this.ctx.model.query(sql, {
            raw: true,
            model: this.ctx.model.IdolModel,
            replacements: { UserId: userId, TokenId: tokenId }
        });
        let affectedRows = 0;
        if (updates != null && updates.length > 0) {
            updates.forEach(function (item, i) {
                if (item.affectedRows == undefined || item.affectedRows == 0) {
                    return true;
                }
                affectedRows = affectedRows + item.affectedRows;
            });
        }
        return affectedRows;
    }

    async unlike(userId, tokenId) {
        let sql = 'START TRANSACTION; '
            + 'DELETE FROM userlikes WHERE TokenId=:TokenId AND UserId=:UserId; '
            + 'UPDATE idols SET LikeCount=LikeCount-1 WHERE TokenId=:TokenId AND ROW_COUNT() > 0;'
            + 'COMMIT';
        let updates = await this.ctx.model.query(sql, {
            raw: true,
            model: this.ctx.model.IdolModel,
            replacements: { UserId: userId, TokenId: tokenId }
        });
        let affectedRows = 0;
        if (updates != null && updates.length > 0) {
            updates.forEach(function (item, i) {
                if (item.affectedRows == undefined || item.affectedRows == 0) {
                    return true;
                }
                affectedRows = affectedRows + item.affectedRows;
            });
        }
        return affectedRows;
    }

}

module.exports = IdolService;