CREATE DATABASE blogging;
USE blogging;
CREATE TABLE users(
id INT AUTO_INCREMENT PRIMARY KEY,
username VARCHAR(100) UNIQUE,
password VARCHAR(100),
role VARCHAR(100)
);
CREATE TABLE posts(
id INT AUTO_INCREMENT PRIMARY KEY,
title VARCHAR(100),
content TEXT,
authorID INT
);

SELECT * FROM posts;
SELECT * FROM users;
insert into users(id,username,password,role) values(6,'shah','123xxx','user');