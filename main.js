var http = require('http');
var fs = require('fs');
var url = require('url');
var qs = require('querystring');
var template = require('./lib/template.js');
var path = require('path');
var sanitizeHtml = require('sanitize-html');

var cookie = require('cookie');

function authIsOwner(request,response){
   var isOwner = false;
    var cookies = {};
    //쿠키값 확인 
    if(request.headers.cookie !== undefined){
      cookies = cookie.parse(request.headers.cookie)
      console.log(cookies);
    }
    //로그인 확인 
    if(cookies.email === 'lkh' && cookies.password === '111'){
      isOwner = true;
    }
  return isOwner;
}

function authStatusUI(request,response){
  var authStatusUI = `<a href=/login>login</a>`
  if( authIsOwner(request,response)){    //위쪽 함수 호출 
    authStatusUI = `<a href=/logout_process>logout</a>`
  }
  return authStatusUI;
}

var app = http.createServer(function(request,response){
    var _url = request.url;
    var queryData = url.parse(_url, true).query;
    var pathname = url.parse(_url, true).pathname;
    

    if(pathname === '/'){
      if(queryData.id === undefined){
        fs.readdir('./data', function(error, filelist){
          var title = 'Welcome';
          var description = 'Hello, Node.js';
          var list = template.list(filelist);
          var html = template.HTML(title, list,
            `<h2>${title}</h2>${description}`,
            `<a href="/create">create</a>`,
            authStatusUI(request,response)
          );
          response.writeHead(200);
          response.end(html);
        });
      } else {
        fs.readdir('./data', function(error, filelist){
          //로그인 유무 판단.
          if(authIsOwner(request,response)===false){
            response.end('Login required!!!')
            return 
          }
          var filteredId = path.parse(queryData.id).base;
          fs.readFile(`data/${filteredId}`, 'utf8', function(err, description){
            var title = queryData.id;
            var sanitizedTitle = sanitizeHtml(title);
            var sanitizedDescription = sanitizeHtml(description, {
              allowedTags:['h1']
            });
            var list = template.list(filelist);
            var html = template.HTML(sanitizedTitle, list,
              `<h2>${sanitizedTitle}</h2>${sanitizedDescription}`,
              ` <a href="/create">create</a>
                <a href="/update?id=${sanitizedTitle}">update</a>
                <form action="delete_process" method="post">
                  <input type="hidden" name="id" value="${sanitizedTitle}">
                  <input type="submit" value="delete">
                </form>`,
                authStatusUI(request,response)
            );
            response.writeHead(200);
            response.end(html);
          });
        });
      }
    } else if(pathname === '/create'){
      
      fs.readdir('./data', function(error, filelist){
        //로그인 유무 판단.
        if(authIsOwner(request,response)===false){
          response.end('Login required!!!')
          return 
        }
        var title = 'WEB - create';
        var list = template.list(filelist);
        var html = template.HTML(title, list, `
          <form action="/create_process" method="post">
            <p><input type="text" name="title" placeholder="title"></p>
            <p>
              <textarea name="description" placeholder="description"></textarea>
            </p>
            <p>
              <input type="submit">
            </p>
          </form>
        `, '',authStatusUI(request,response));
        response.writeHead(200);
        response.end(html);
      });
    } else if(pathname === '/create_process'){
      //로그인 유무 판단.
      if(authIsOwner(request,response)===false){
          response.end('Login required!!!')
          return 
      }
      var body = '';
      request.on('data', function(data){
          body = body + data;
      });
      request.on('end', function(){
          var post = qs.parse(body);
          var title = post.title;
          var description = post.description;
          fs.writeFile(`data/${title}`, description, 'utf8', function(err){
            response.writeHead(302, {Location: `/?id=${title}`});
            response.end();
          })
      });
    } else if(pathname === '/update'){
      
      fs.readdir('./data', function(error, filelist){
        //로그인 유무 판단.
      if(authIsOwner(request,response)===false){
        response.end('Login required!!!')
        return 
    }
        var filteredId = path.parse(queryData.id).base;
        fs.readFile(`data/${filteredId}`, 'utf8', function(err, description){
          var title = queryData.id;
          var list = template.list(filelist);
          var html = template.HTML(title, list,
            `
            <form action="/update_process" method="post">
              <input type="hidden" name="id" value="${title}">
              <p><input type="text" name="title" placeholder="title" value="${title}"></p>
              <p>
                <textarea name="description" placeholder="description">${description}</textarea>
              </p>
              <p>
                <input type="submit">
              </p>
            </form>
            `,
            `<a href="/create">create</a> <a href="/update?id=${title}">update</a>`,
            authStatusUI(request,response)
          );
          response.writeHead(200);
          response.end(html);
        });
      });
    } else if(pathname === '/update_process'){
      //로그인 유무 판단.
      if(authIsOwner(request,response)===false){
        response.end('Login required!!!')
        return 
    }
      var body = '';
      request.on('data', function(data){
          body = body + data;
      });
      request.on('end', function(){
          var post = qs.parse(body);
          var id = post.id;
          var title = post.title;
          var description = post.description;
          fs.rename(`data/${id}`, `data/${title}`, function(error){
            fs.writeFile(`data/${title}`, description, 'utf8', function(err){
              response.writeHead(302, {Location: `/?id=${title}`});
              response.end();
            })
          });
      });
    } else if(pathname === '/delete_process'){
      //로그인 유무 판단.
      if(authIsOwner(request,response)===false){
        response.end('Login required!!!')
        return 
    }
      var body = '';
      request.on('data', function(data){
          body = body + data;
      });
      request.on('end', function(){
          var post = qs.parse(body);
          var id = post.id;
          var filteredId = path.parse(id).base;
          fs.unlink(`data/${filteredId}`, function(error){
            response.writeHead(302, {Location: `/`});
            response.end();
          })
      });
    } else if(pathname === '/login'){
      if(queryData.id === undefined){
        fs.readdir('./data', function(error, filelist){
          var title = 'Login';
          var list = template.list(filelist);
          var html = template.HTML(title, list,
            `
            <form action="login_process" method="post">
              <p><input type="text" name="email" placeholder="email"></p>
              <p><input type="text" name="password" placeholder="password"></p>
              <p><input type="submit" ></p>
            </form>`,
            `<a href ="/create">create</a>`
          );
          response.writeHead(200);
          response.end(html);
        });
      }
   }else if(pathname === '/login_process'){
    var body = '';
    request.on('data', function(data){
        body = body + data;
    });
    request.on('end', function(){
        var post = qs.parse(body);
        if(post.email === 'lkh' && post.password === '111'){
          response.writeHead(302, {
            'Set-Cookie':[
             `email=${post.email}`,
             `password=${post.password}`,
             `nickname=lkh`
          ],Location:`/`
          
        });
          response.end();
        } else{
          //로그인 실패시 
          response.end('Who ?');
        }  
    });
  
  }
  else if(pathname === '/logout_process'){
    var body = '';
    request.on('data', function(data){
        body = body + data;
    });
    request.on('end', function(){
        var post = qs.parse(body);
          response.writeHead(302, {
            'Set-Cookie':[
             `email=; Max-Age=0;`,
             `password=; Max-Age=0;`,
             `nickname=; Max-Age=0;`
          ],Location:`/`
          
        });
          response.end();
    
    });
  
  }
    else {
      response.writeHead(404);
      response.end('Not found');
    }
});
app.listen(3000);
