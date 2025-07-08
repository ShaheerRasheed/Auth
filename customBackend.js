const http=require('http')
const fs=require('fs')
const server = http.createServer((req, res) => {
    console.log(req.url)

    res,statuscode=200
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello World!');
});

server.listen(5500, '127.0.0.1', () => {
  console.log('Listening on 127.0.0.1:5500');
  console.log('nodemon test')
});