const bcrypt = require('bcryptjs');
const client = require('../lib/client');
// import our seed data:
const favorite_books = require('./favorite-books.js');
const usersData = require('./users.js');
const { getEmoji } = require('../lib/emoji.js');
run();

async function run() {

  try {
    await client.connect();

    const users = await Promise.all(
      usersData.map(user => {
        const hash = bcrypt.hashSync(user.password, 8);
        return client.query(`
                      INSERT INTO users (email, hash)
                      VALUES ($1, $2)
                      RETURNING *;
                  `,
        [user.email, hash]);
      })
    );
      
    const user = users[0].rows[0];

    await Promise.all(
      favorite_books.map(book => {
        return client.query(`
                    INSERT INTO favorite_books (title, author, isbn, owner_id)
                    VALUES ($1, $2, $3, $4);
                `,
        [book.title, book.author, book.isbn, user.id]);
      })
    );
    

    console.log('seed data load complete', getEmoji(), getEmoji(), getEmoji());
  }
  catch(err) {
    console.log(err);
  }
  finally {
    client.end();
  }
    
}
