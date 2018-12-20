// 错误码统一编码，提示信息多语言
module.exports = {

  success: 0,
  addressNotFound: 10001,
  noLogin: 10002,
  idolNotFound: 20001,



  returnObj(lang) {

    en = {
      lang: 'en',
      success: { code: this.success, message: 'success' },
      addressNotFound: { code: this.addressNotFound, message: 'address not found' },
      noLogin: { code: this.noLogin, message: "no login" },
      idolNotFound: { code: this.idolNotFound, message: "idol not found" },

    };

    zh = {
      lang: 'zh',
      success: { code: this.success, message: '成功' },
      addressNotFound: { code: this.addressNotFound, message: '未注册' },
      noLogin: { code: this.noLogin, message: "未登录，请先登录" },
      idolNotFound: { code: this.idolNotFound, message: "找不到数据" },
    };

    let message;

    switch (lang) {
      case 'en':
        message = en;
        break;
      case 'zh':
      case 'zh-Hans':
        message = zh;
        break;
      default:
        message = zh;
        break;
    }

    return message;
  },

};
