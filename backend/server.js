const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const jwt = require('jsonwebtoken');
const SECRET_KEY = 'suPerRo1DEr';

const app = express();
app.use(cors());
app.use(express.json());
const bcrypt = require('bcrypt');
const validator = require('validator');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'hidden_archives_db',
  password: 'CookiesJars',
  port: 5432,
});


app.post('/api/login', async (req, res) => {
  const {email, password} = req.body;
  if (!validator.isEmail(email)) {
    return res.status(400).json({ ok: false, message: 'Please provide a valid email.' });
  }
  try {
    const q = 'SELECT * FROM public."Users" WHERE "emailAddress" = $1';
    const result = await pool.query(q, [email]);
    
    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if(isMatch){
      console.log("Bcrypt match found!");
      return res.status(200).json({ 
        ok: true, 
        token: user.status
      });
    }else{
      console.log("User not found in DB");
      return res.status(401).json({ ok: false, message: 'Invalid email or password' });
    }
  } catch (err) {
    console.error("BACKEND ERROR:", err.message);
    res.status(500).json({ ok: false, message: err.message });
  }
});


app.post('/api/register', async (req, res) => {
  const {username, email, password} = req.body;
  if (!validator.isEmail(email)) {
    return res.status(400).json({ ok: false, message: 'Please provide a valid email.' });
  }
  console.log('started registering...')
  try {
    let q = 'SELECT * FROM public."Users" WHERE "emailAddress" = $1 OR "username" = $2';
    let values = [email, username];
    const result = await pool.query(q, values);

    if(result.rows.length > 0){
      return res.status(400).json({ 
        ok: false,
        message: 'User already exists.', 
      });
    }else {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      q = `INSERT INTO public."Users" ("username", "password", "status", "emailAddress")
          VALUES($1, $2, $3, $4)`;
      values = [username, hashedPassword, 'user', email];
      await pool.query(q, values);

      res.status(201).json({
        ok: true,
        message: 'User successfuly registered!',
      })
    }
  }catch(err){
    console.error(err.message);
    res.status(500).json({ ok: false, message: err.message });
  }
});


app.post('/api/getBooks', async (req, res) => {
  try {
    const q = `SELECT 
                b."ID",
                b."imageIdentifier" AS "imgSrc",
                b."bookTitle" AS "title",
                a."authorName" AS "author",
                b."status",
                b."quantity" AS "qty"
              FROM
                public."Books" b
              INNER JOIN 
                public."Authors" a ON b."authorID" = a."ID";`;
    const result = await pool.query(q);
    if(result.rows.length > 0){
      const user = result.rows[0];
      res.status(200).json({ 
        ok: true,
        message: 'Books retrieved successfully!', 
        books: { result: result.rows },
      });
    }else {
      res.status(401).json({ ok: false, message: 'Invalid email or password' });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ ok: false, message: err.message });
  }
});

app.post('/api/getAuthors', async (req, res) => {
  try {
    const q = `SELECT * FROM public."Authors"`;
    const result = await pool.query(q);
    if(result.rows.length > 0){
      const user = result.rows[0];
      res.status(200).json({ 
        ok: true,
        message: 'Author info retrieved successfully!', 
        books: { result: result.rows },
      });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ ok: false, message: err.message });
  }
});

app.post('/api/addBook', async (req, res) => {
  const {author, title, bookIdentifier, status, qty} = req.body;
  console.log('started adding the book...')
    let q = `SELECT * FROM public."Books"
            WHERE "bookTitle" = $1 AND "authorID" = $2`;
    let values = [title, author];
    
  try{
    const resultChecking = await pool.query(q, values);
    if(resultChecking.rows.length > 0){
      res.status(400).json({
        ok: false,
        message: 'Book already exists...',
      });
      return;
    }
  }catch(err){
    console.error(err.message);
    res.status(500).json({ ok: false, message: err.message });
  }
  try {
    q = `INSERT INTO public."Books" ("imageIdentifier", "bookTitle", "authorID", "status", "quantity")
          VALUES($1, $2, $3, $4, $5)`;
    values = [bookIdentifier, title, author, status, qty];
    await pool.query(q, values);

    res.status(201).json({
      ok: true,
      message: 'Book successfuly added!',
    })
  }catch(err){
    console.error(err.message);
    res.status(500).json({ ok: false, message: err.message });
  }
});

app.post('/api/addAuthor', async (req, res) => {
  const {authorName} = req.body;
  let q = `INSERT INTO public."Authors" ("authorName") VALUES ($1)`
  let values = [authorName];

  try{
    const result = await pool.query(q, values);

    res.status(201).json({
      ok: true,
      message: 'Author successfuly added!',
    })
  }catch(err){
    console.error(err.message);
    res.status(500).json({ ok: false, message: err.message });
  }

});

app.post('/api/searchBook', async (req, res) => {
  const {bookName} = req.body;
  let q = `SELECT 
                b."ID",
                b."imageIdentifier" AS "imgSrc",
                b."bookTitle" AS "title",
                a."authorName" AS "author",
                b."status",
                b."quantity" AS "qty"
              FROM
                public."Books" b
              INNER JOIN 
                public."Authors" a ON b."authorID" = a."ID"
              WHERE b."bookTitle" ILIKE $1;`;
  let values = [`%${bookName}%`];

  try{
    const result = await pool.query(q, values);

    res.status(200).json({
      ok: true,
      message: 'Books found', 
      books: { result: result.rows },
    })
  }catch(err){
    console.error(err.message);
    res.status(500).json({ ok: false, message: err.message });
  }

});

app.post('/api/deleteBook', async (req, res) => {
  const {bookID} = req.body;
  const q = `DELETE FROM public."Books" WHERE "ID" = $1`;
  const values = [bookID];
  try{
    const result = await pool.query(q, values);

    res.status(200).json({
      ok: true,
      message: 'Book successfuly deleted.',
    })
  }catch(err){
    console.error(err.message);
    res.status(500).json({ ok: false, message: err.message });
  }
});

app.post('/api/editBook', async (req, res) => {
  const {bookID, title, authorID ,status, qty} = req.body;
  const q = `UPDATE public."Books" SET "bookTitle" = $1, "authorID" = $2, "status" = $3, "quantity" = $4
              WHERE "ID" = $5`;
  const values = [title, authorID ,status, qty, bookID];
  try{
    const result = await pool.query(q, values);

    res.status(200).json({
      ok: true,
      message: 'Book successfuly edited.',
    })
  }catch(err){
    console.error(err.message);
    res.status(500).json({ ok: false, message: err.message });
  }
});

app.post('/api/searchBookByID', async (req, res) => {
  const {authorID} = req.body;
  try {
    const q = `SELECT 
                b."ID",
                b."imageIdentifier" AS "imgSrc",
                b."bookTitle" AS "title",
                a."authorName" AS "author",
                b."status",
                b."quantity" AS "qty"
              FROM
                public."Books" b
              INNER JOIN 
                public."Authors" a ON b."authorID" = a."ID"
              WHERE b."authorID" = $1;`;
    const values = [authorID];
    const result = await pool.query(q, values);
    if(result.rows.length > 0){
      const user = result.rows[0];
      res.status(200).json({ 
        ok: true,
        message: 'Author work retrieved successfully!', 
        books: { result: result.rows },
      });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ ok: false, message: err.message });
  }
});

app.listen(3000, () => console.log('Backend running on port 3000'));
