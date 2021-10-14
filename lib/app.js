const express = require('express');
const cors = require('cors');
const client = require('./client.js');
const app = express();
const morgan = require('morgan');
const ensureAuth = require('./auth/ensure-auth');
const createAuthRoutes = require('./auth/create-auth-routes');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev')); // http logging

const authRoutes = createAuthRoutes();

// setup authentication routes to give user an auth token
// creates a /auth/signin and a /auth/signup POST route.
// each requires a POST body with a .email and a .password
app.use('/auth', authRoutes);

// everything that starts with "/api" below here requires an auth token!
app.use('/api', ensureAuth);

// and now every request that has a token in the Authorization header will have a `req.userId` property for us to see who's talking
app.get('/api/test', (req, res) => {
  res.json({
    message: `in this proctected route, we get the user's id like so: ${req.userId}`
  });
});

app.get('/api/favorite', async (req, res) => {
  try {
    const data = await client.query(`SELECT * from favorite_books
    WHERE owner_id = $1`, [req.userId]);

    res.json(data.rows);
  } catch (e) {

    res.status(500).json({ error: e.message });
  }
});

app.post('/api/favorite', async (req, res) => {
  try {
    const data = await client.query(`INSERT into favorite_books (title, author, isbn, owner_id)
    VALUES ($1, $2, $3, $4)
    RETURNING *`, [req.body.title, req.body.author, req.body.isbn, req.userId]);
    res.json(data.rows);
  } catch (e) {

    res.status(500).json({ error: e.message });
  }
});

app.put('/api/favorite/:id', async (req, res) => {
  try {
    const data = await client.query(`UPDATE favorite_books
    SET title=$1, author=$2, isbn=$3, owner_id=$4
    WHERE id=$5`, [req.body.title, req.body.author, req.body.isbn, req.userId]);

    res.json(data.rows);
  } catch (e) {

    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/favorite/:id', async (req, res) => {
  try {
    const data = await client.query(`DELETE from favorite_books
    WHERE id=$1
    RETURNING *`, [req.params.id]);

    res.json(data.rows);
  } catch (e) {

    res.status(500).json({ error: e.message });
  }
});

app.use(require('./middleware/error'));

module.exports = app;
