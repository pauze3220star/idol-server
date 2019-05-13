# idol

<iframe width="560" height="315" src="https://www.youtube.com/embed/oqOIiuFqxwY" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>


## QuickStart

<!-- add docs here for user -->

see [egg docs][egg] for more detail.

### Development

```bash
$ npm i
$ npm run dev
$ open http://localhost:7001/
```

### Deploy

```bash
$ npm start
$ npm stop
```

### npm scripts

- Use `npm run lint` to check code style.
- Use `npm test` to run unit test.
- Use `npm run autod` to auto detect dependencies upgrade, see [autod](https://www.npmjs.com/package/autod) for more detail.


[egg]: https://eggjs.org



## 安装服务器
- LobbyServer为平台服务器，首先把LobbyServer运行起来，Lobby监听13000端口；GameServer/cowserver_qianzhuang为牛牛游戏服务器，运行后与Lobby服务器建立连接，并为client端提供服务

### 1. 安装数据库
- 数据库为MySQL，可以使用mysql-5.7.24版本，使用默认的3306端口，安装完成后设置root密码
- 创建数据库名：gameaccount，执行ameaccount.sql脚本，即可还原整个库，这是账号、充值、计费等平台相关数据库
- 创建数据库名：qiang_cow，执行qiang_cow.sql脚本，即可还原整个库，这是抢庄牛牛的游戏数据库
- dragon_tiger.sql、fish.sql 是另外两款游戏的数据库，应该可以不用创建
- 根据LobbyServer\receipt.js文件创建新账号并授权

创建新账号：
~~~
create user 'gamedb'@'%' IDENTIFIED BY '112233'
~~~
授权：
~~~
grant ALL on gameaccount.* to 'gamedb'@'%';
grant ALL on qiang_cow.* to 'gamedb'@'%';
~~~

### 2. LobbyServer运行步骤
- 在LobbyServer目录下安装npm包
~~~
npm install
~~~
- 如未安装pm2，全局安装pm2：
~~~
npm install pm2 -g
~~~
- 修改数据库配置LobbyServer\dao\dao.js，修改password，另一处LobbyServer\receipt.js使用gamedb账号，上面已经创建了，这里不用修改代码
- 此时执行start.bat会报错，cmd窗口会提示错误日志文件位置，通过日志查看缺少的npm包，逐一安装（可能还有其它，没有完全记录下来）：
~~~
npm install express
npm install urlencode
npm install multer
npm install consolidate
npm install express-static
npm install eosws
npm install log4js
~~~
注：安装了log4js后仍然会报错，先把LobbyServer\class\loginfo.js log4js相关的代码注释掉，这是记录日志的，不会影响系统运行，回头把这块重新调试好
- 注释掉https证书相关配置，LobbyServer\app.js
~~~ javascript
// const options = {
//     key: fs.readFileSync("./100yx/private.key"),
//     cert: fs.readFileSync("./100yx/full_chain.pem")
// };
~~~
- npm包、数据库、log4js、https证书几处完成再次执行start.bat应该就成功了
- pm2 list查看当前运行状态，显示online则正在运行

### 3. GameServer\cowserver_qianzhuang运行步骤：
- 在GameServer\cowserver_qianzhuang目录安装npm包
~~~
npm install
~~~
- 修改数据库配置GameServer\CClass\dao\gameDao.js、GameServer\cowserver_qianzhuang\class\gameDao.js，修改password
- 在GameServer\cowserver_qianzhuang目录PowerShell中执行node app.js，此时会报错，按照提示安装缺少的npm包
- 注释掉https证书相关配置，GameServer\cowserver_qianzhuang\app.js
~~~ javascript
// const options = {
//     key: fs.readFileSync("./100yx/private.key"),
//     cert: fs.readFileSync("./100yx/full_chain.pem")
// };
~~~
- 注释掉log4js相关代码，GameServer\CClass\class\loginfo.js
- GameServer\cowserver_qianzhuang\app.js有LobbyServer地址，两个程序在同一台运行则不用修改
~~~
var Csocket = Cio("http://localhost:13000");
~~~
- npm包、数据库、log4js、https证书几处完成PowerShell中执行node app.js应该就成功了，会提示：
~~~
牛牛游戏服务器启动
与登录服务器进行连接......
连接成功
~~~
----------------------------------------------------------------------------------------------------------------
