### 数据库部署
* 在原数据库更新，执行《数据库更新脚本.sql》

user表新增字段：
AP~AuthFlag

candy_project新增字段：
IsOnlyRedpacket、IsDisplay

新增表：
redpacket
redpacket_item
redpacket_item_probability
redpacket_userlog

* 全库还原
测试时也可全库还原，执行《candybox-fullbckup.sql》


### 后端部署

* 代码：
https://git.coding.net/xiaomin-ontology/candybox-server.git 
dapp_dev分支

* 安装运营：
```bash
$ npm install
开发环境
$ npm run dev
生产环境
$ npm start
$ npm stop
```

### 前端部署
* 代码地址
https://git.coding.net/xinhuadx/candybox-web.git


```bash
$ yarn install
开发环境
$ yarn run serve
生产环境
$ yarn run build
```
