'use strict';

module.exports = appInfo => {
  const config = exports = {};

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1544608605980_4384';

  // 请修改jwt密钥和失效时间
  config.login = {
    secretKey: 'xO18B58fgfsv1UafNOoYuyKt9cjmD9Oa', // jwt密钥
    expires: 60 * 60 * 24, // 超时时间24小时
};

  // add your config here
  config.middleware = [];

   // 配置端口号，主机名
   config.cluster = {
    listen: {
      path: '',
      port: 7001,
      hostname: '',
      https: true,
    },
  };

  // 请修改日志路径
  exports.logger = {
    dir: appInfo.root + '/logs/' + appInfo.name,
  };

  // 请修改数据库配置
  config.sequelize = {
    dialect: 'mysql',
    hostname: '47.100.77.82',
    host: '47.100.77.82',
    port: 3306,
    database: 'andromeda_idol',
    username: 'andoromeda',
    // 密码
    password: 'GKuLy8ereycO',
    dialectOptions: {
      multipleStatements: true,
    },
  };

  return config;
};
