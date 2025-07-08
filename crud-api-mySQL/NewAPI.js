//--importing modules
const http = require('http');
const mysql=require('mysql2')
const url=require('url')
const PORT=3000

//--setting up mySQL connection
//creates mySQL connection
const db=mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'InterSys@2024',
    database:'myapp'
})

//--connects to the database
db.connect(err=>{
    if (err){
    console.log('database connection failed: ',err)
    return }
    console.log('connected to mySQL database')
})

//--function to parse requests
function getBody(req) {
  return new Promise(resolve => {
    let body = '';
    req.on('data', chunk => (body += chunk)); //listens for 'data' event, when chunks of data comes from request body its added to body.
    req.on('end', () => {                   //listens for 'end' event, runs when all chunks of data has been recieved
      try {
        resolve(JSON.parse(body));    //converts string to object using JSON.parse
                                      //resolves the promise on line 26, when all data recieved and parsed, then we call resolve to return the result.
      } catch {
        resolve({});                  //sends a empty object incase json is invalid (or error)
      }
    });
  });
}

http.createServer(async (req, res) => {                     //sets up HTTP server 
  const { pathname, query } = url.parse(req.url, true);        //breaks url (/user?id=1) into pathname=/user and query={id:'1'}
  const id = query.id;
  const method = req.method;
  const [_, base] = pathname.split('/');                        //splits the pathname '/user' into [' ', user] so now base = user
  res.setHeader('Content-Type', 'application/json');

  if (method === 'GET' && base === 'users') {                                       
    db.query('SELECT * FROM users', (_, r) => res.end(JSON.stringify(r)));          //runs SQL statements (fetch all users in this case)
                                                                                    //sends back the array as a JSON response

  } else if (method === 'GET' && base === 'users' && id) {                           
    db.query('SELECT * FROM users WHERE id = ?', [id], (_, r) =>                    //fetch single user (? is replaced by id)
      res.end(JSON.stringify(r[0] || { error: 'Not found' }))                       //r[0] is first result, return error if user not found  
    );


  } else if (method === 'POST' && base === 'users') {                                       
      const { name, email } = await getBody(req);
      db.query('INSERT INTO users (name, email) VALUES (?, ?)', [name, email], (_, r) =>              //create new user
        res.end(JSON.stringify({ id: r.insertId, name, email }))                                      //sends json response back to client
      );                                                                                              //insertId is id of new user row inserted in db


  } else if (method === 'PUT' && base === 'users' && id) {                                              //update user
    const { name, email } = await getBody(req);                                                         
    db.query('UPDATE users SET name=?, email=? WHERE id=?', [name, email, id], (_, r) =>
      res.end(JSON.stringify(r.affectedRows ? { id, name, email } : { error: 'Not found' }))            //number of rows affected by the updating
    );                                                                                                  //if r.affectedrows===1 then id,name,email otherwise no
                                                                                                        //no row is updated and so error not found.


  } else if (method === 'DELETE' && base === 'users' && id) {                                            //delete user
    db.query('DELETE FROM users WHERE id=?', [id], (_, r) =>                                    
      res.end(JSON.stringify(r.affectedRows ? { message: 'Deleted' } : { error: 'Not found' }))         //if affected (deleted) rows===1, then message deleted
    );

  } else {
    res.writeHead(404).end(JSON.stringify({ error: 'Route not found' }));                               //if none scenario then display error (also in json)
  }
}).listen(3000, () => console.log('🚀 Server on http://localhost:3000'));                               //start the server

