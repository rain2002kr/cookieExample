var http = require('http');
var cookie = require('cookie');
http.createServer(function(request, response){
      response.writeHead(200, {
          'Set-Cookie':['yummy_cookie=choco',
          'tasty_cookie=strawberry',
          `Permanent=cookies; Max-Age=${60*60*24*30}`, //세션의 타임값을 지정할수 있습니다. 
          'Secure=Secure; Secure',      //https 로 통신할때만 나옵니다. 
          'HttpOnly=HttpOnly; HttpOnly', //자바스크립트 콘솔창에서 Document.cookie 처도 안나옵니다. 
          'Path=Path; Path=/cookie',
          'Doamin=Domain; Domain=test.o2.org'

        ]
      });

      //console.log(request.headers.cookie)
      var cookies ={};
      if(cookies !== undefined){
        cookies = cookie.parse(request.headers.cookie);
        console.log(cookies.yummy_cookie);
        console.log(cookies.tasty_cookie);
        
      }

    response.end('Cookie!!');
}).listen(3000);