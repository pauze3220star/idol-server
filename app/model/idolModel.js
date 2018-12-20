module.exports = app => {
    const { STRING, INTEGER, BIGINT } = app.Sequelize;

    const IdolModel = app.model.define('idol', {
        TokenId: { type: BIGINT, primaryKey: true },
        UserId: BIGINT,
        NickName: STRING,
        Genes: STRING,
        BirthTime: INTEGER,
        Introduction: STRING,
        Pic: STRING,
        Generation: INTEGER,
        Cooldown: INTEGER,
        HairColor: INTEGER,
        EyeColor: INTEGER,
        HairStyle: INTEGER,
        MatronId: BIGINT,
        SireId: BIGINT,
        LikeCount: INTEGER,
        IsForSale: INTEGER,
        IsRental: INTEGER,
        IsLike: INTEGER,
        LikeId: INTEGER
    },
        {
            timestamps: false,
            freezeTableName: true,
            tableName: 'idols',
        }
    );

    return IdolModel;
}