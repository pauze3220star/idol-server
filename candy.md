## 后端部署

* 数据库部署
执行《数据库更新脚本.sql》

user表新增字段：
AP~RedPacketCount

candy_project新增字段：
IsOnlyRedpacket、IsDisplay

新增表：
redpacket
redpacket_item
redpacket_item_probability
redpacket_userlog


* 代码：
https://git.coding.net/xiaomin-ontology/candybox-server.git 
dapp_dev分支

$ npm i
$ npm run dev
