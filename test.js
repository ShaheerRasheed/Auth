const http=require('http')
const fs=require('fs')
const fileContent =fs.readFileSync('TestContent.html')
const server=http.createServer((req,res) => {
res.writeHead(200,{'Content-Type':'text/html'})
res.end(fileContent)
})
server.listen(80,'127.0.0.2',()=>{
  console.log('listening 80')
})