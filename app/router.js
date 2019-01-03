'use strict';
const Passport = require('./service/passport');
const tronService = require("./TronEvents/tronService");

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller, service } = app;
  router.opts.sensitive = false;
  router.get('/', controller.home.index);

  router.post('/user/login', controller.user.login);
  router.post('/user/register', controller.user.register);
  router.post('/user/getUserInfo', controller.user.getUserInfo);
  router.post('/user/signtest', controller.user.signtest);
  router.post('/user/trontest', controller.user.trontest);
  router.post('/user/initIdol', controller.user.initIdol);
  router.post('/user/initAuction', controller.user.initAuction);
  
  router.post('/idol/setName', Passport.verify, controller.idol.setName);
  router.post('/idol/setBio', Passport.verify, controller.idol.setBio);

  router.get('/idol/getIdol', Passport.verify, controller.idol.getIdol);
  router.get('/idol/getMyIdols', Passport.authorize, controller.idol.getMyIdols);
  router.get('/idol/getMarketIdols', Passport.verify, controller.idol.getMarketIdols);

  router.post('/idol/like', Passport.verify, controller.idol.like);
  router.post('/idol/unlike', Passport.verify, controller.idol.unlike);

  tronService.listenIdolUpdate();
};
