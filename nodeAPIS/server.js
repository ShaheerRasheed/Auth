const http = require('http');
const mysql = require('mysql2');
const url = require('url');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'InterSys@2024',
  database: 'myapp'
});
db.connect();

const getBody = req => new Promise(resolve => {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    try { resolve(JSON.parse(body)); } catch { resolve({}); }
  });
});

http.createServer(async (req, res) => {
  const { pathname, query } = url.parse(req.url, true);
  const id = query.id;
  const method = req.method;
  const [_, base] = pathname.split('/');
  res.setHeader('Content-Type', 'application/json');
//get ki api

  if (method === 'GET' && base === 'users') {
    db.query('SELECT * FROM users', (_, r) => res.end(JSON.stringify(r)));
  } else if (method === 'GET' && base === 'user' && id) {
    db.query('SELECT * FROM users WHERE id=?', [id], (_, r) =>
      res.end(JSON.stringify(r[0] || { error: 'Not found' }))
    );
//wrna data dal dena  
} else if (method === 'POST' && base === 'users') {
    const { name, email } = await getBody(req);
    db.query('INSERT INTO users (name, email) VALUES (?, ?)', [name, email], (_, r) =>
      res.end(JSON.stringify({ id: r.insertId, name, email }))
    );
} 
//   wrna data update\
  
  else if (method === 'PUT' && base === 'user' && id) {
    const { name, email } = await getBody(req);
    db.query('UPDATE users SET name=?, email=? WHERE id=?', [name, email, id], (_, r) =>
      res.end(JSON.stringify(r.affectedRows ? { id, name, email } : { error: 'Not found' }))
    );
  } else if (method === 'DELETE' && base === 'user' && id) {
    db.query('DELETE FROM users WHERE id=?', [id], (_, r) =>
      res.end(JSON.stringify(r.affectedRows ? { message: 'Deleted' } : { error: 'Not found' }))
    );
  } else {
    res.writeHead(404).end(JSON.stringify({ error: 'Route not found' }));
  }
}).listen(3000, () => console.log('🚀 Server running at http://localhost:3000'));
