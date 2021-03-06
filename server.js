var http = require('http');
var fs = require('fs');
var url = require('url');
var port = process.argv[2];
var qiniu = require('qiniu');

if (!port) {
  console.log('请指定端口号好不啦？\nnode server.js 8888 这样不会吗？');
  process.exit(1);
}
let sessions = {};
var server = http.createServer(function(request, response) {
  var parsedUrl = url.parse(request.url, true);
  var pathWithQuery = request.url;
  var queryString = '';
  if (pathWithQuery.indexOf('?') >= 0) {
    queryString = pathWithQuery.substring(pathWithQuery.indexOf('?'));
  }
  var path = parsedUrl.pathname;
  var query = parsedUrl.query;
  var method = request.method;

  /******** 从这里开始看，上面不要看 ************/

  console.log('方方说：含查询字符串的路径\n' + pathWithQuery);

  if (path === '/uptoken') {
    response.statusCode = 200;
    response.removeHeader('Date');
    response.setHeader('Content-Type', 'text/json;charset=utf-8');
    //Access-Control-Allow-Origin-访问控制允许来源: 允许所有的来源!
    response.setHeader('Access-Control-Allow-Origin', '*');
    //因为使用fs.readFileSync读取到的是一个JSON文件
    var config = fs.readFileSync('./qiniu_config.json');
    //因此拿到的是JSON风格的字符串! 对其进行解析
    config = JSON.parse(config);

    //ES6析构语法!
    let { accessKey, secretKey } = config;

    var mac = new qiniu.auth.digest.Mac(accessKey, secretKey);

    var options = {
      //scopr:buket 范围:桶 篮子
      scope: 'music-163'
    };
    var putPolicy = new qiniu.rs.PutPolicy(options);
    var uploadToken = putPolicy.uploadToken(mac);

    response.write(`{
        "uptoken":"${uploadToken}"
    }`);
    response.end();
  } else {
    response.statusCode = 404;
    response.setHeader('Content-Type', 'text/html;charset=utf-8');
    response.end();
  }

  /******** 代码结束，下面不要看 ************/
});
function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = [];
    request
      .on('data', chunk => {
        body.push(chunk);
      })
      .on('end', () => {
        body = Buffer.concat(body).toString();
        resolve(body);
      });
  });
}
server.listen(port);
console.log(
  '监听 ' +
    port +
    ' 成功\n请用在空中转体720度然后用电饭煲打开 http://localhost:' +
    port
);
