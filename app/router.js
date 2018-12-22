'use strict';
const Passport = require('./service/passport');

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  router.opts.sensitive = false;
  router.get('/', controller.home.index);

  router.post('/user/login', controller.user.login);
  router.post('/user/register', controller.user.register);
  router.post('/user/getUserInfo', controller.user.getUserInfo);

  router.post('/idol/setName', Passport.verify, controller.idol.setName);
  router.post('/idol/setBio', Passport.verify, controller.idol.setBio);

  router.get('/idol/getIdol', Passport.verify, controller.idol.getIdol);
  router.get('/idol/getMyIdols', Passport.authorize, controller.idol.getMyIdols);
  router.get('/idol/getMarketIdols', controller.idol.getMarketIdols);

  router.post('/idol/like', Passport.verify, controller.idol.like);
  router.post('/idol/unlike', Passport.verify, controller.idol.unlike);

};
