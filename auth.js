const express = require('express')
const jwt=require('jsonwebtoken')
const bcrypt=require('bcrypt')
const bodyParser=require('body-parser')
const app=express()
const mysql = require('mysql2')
const db= mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'InterSys@2024',
  database: 'blogging',
})
app.use(bodyParser.json())
db.connect(err=>{
    if (err){
    console.log('database connection failed:')
    }
    console.log('connected to database')
})
const JWT_KEY='$%45^&67*(89'
app.post('/register',async(req,res)=>{
    const {username,password,role}=req.body
    await db.execute('INSERT INTO users(username, password, role) VALUES (?,?,?)',[username,password,role]) //new user
    res.json({message:`user registered, token is ${JWT_KEY}`})
})
app.post('/login',async(req,res)=>{               //login
    const {username,password}=req.body
    const [rows]=db.execute('SELECT * FROM users WHERE username=?',[username])      //returns entire array of a user to [rows] variable
    if(rows.length===0){
      return res.status(401).json({message:'invalid username'})                   //check username and password
    }
    const user=rows[0]                                                            //pehla element
    const passwordMatch=await bcrypt.compare(password,user.password)
    if(!passwordMatch){
      return res.status(401).json({message:'invalid password'})
    }
    const token=jwt.sign({id: user.id,username:user.username,role:user.role},JWT_KEY)                 //token
    res.json({message:'login successful',token})                                                    
})
const auth=(req,res,next)=>{                                                                        //middleware, checking user's token
    const authHeader=req.headers.authorization  
    if (!authHeader)
        return res.status(401).json({message:'Missing token'})
    const token=authHeader.split(' ')[1]
    const decoded=jwt.verify(token, JWT_KEY)
    req.user=decoded
    next()
}
app.get('/profile',auth,async(req, res)=>{
  const [rows]=await db.execute('SELECT id, username, role FROM users WHERE id = ?',[req.user.id])
  res.json({user:rows[0]})
})
app.get('/admin',auth,(req, res)=>{                                                                  //admin
  if(req.user.role!=='admin') 
    return res.status(403).json({message:'Admins only'})
  res.json({message:'Welcome to admin'})
})
app.post('/posts',auth,async(req,res)=>{                                                            //create
  const{title,content}=req.body
  await db.execute('INSERT INTO posts (title, content, author_id) VALUES (?, ?, ?)',[title, content, req.user.id])
  res.json({message:'post created'})
});
app.get('/posts',async(req,res)=>{                                                              //get all
  const [posts]=await db.execute(
    `SELECT posts.*, users.username AS author 
    FROM posts 
    JOIN users ON posts.author_id = users.id`
  )
  res.json({posts})
})
app.get('/posts/:id',async(req,res)=>{                                                        //get single
  const [rows]=await db.execute(
    `SELECT posts.*, users.username AS author 
    FROM posts 
    JOIN users ON posts.author_id = users.id
    WHERE posts.id=?`,[req.params.id]
  )
  res.json({post:rows[0]})
})
app.put('/posts/:id',auth,async(req,res)=>{                                                           //update
  const{title,content}=req.body                                                   
  const[rows]=await db.execute('SELECT * FROM posts WHERE id = ?',[req.params.id])
  const post=rows[0]
  if(post.author_id !== req.user.id && req.user.role !== 'admin')
    {return res.json({ message: 'not allowed' })}
  await db.execute('UPDATE posts SET title=?,content=? WHERE id=?',[title, content, req.params.id])
  res.json({ message:'post updated'})
})
app.delete('/posts/:id',auth,async(req,res)=>{
  const [rows]=await db.execute('SELECT * FROM posts WHERE id = ?',[req.params.id])
  const post = rows[0]
  if(post.author_id !== req.user.id && req.user.role !== 'admin')
    {return res.json({message:'not allowed'})}
  await db.execute('DELETE FROM posts WHERE id = ?',[req.params.id])
  res.json({message:'post deleted'})
})

app.listen(3000,()=>{                                                                                       //start server
  console.log('Server running on port 3000')            
})
