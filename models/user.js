/** User class for message.ly */
const db = require("../db")
const ExpressError = require("../expressError")
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {BCRYPT_WORK_FACTOR, SECRET_KEY} = require("../config");

/** User of the site. */

class User {

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register(username, password, first_name, last_name, phone) { 
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR)

    const result = await db.query(
      `INSERT INTO users (username, password, first_name, last_name, phone, join_at, last_login_at)
      VALUES ($1,$2,$3,$4,$5, current_timestamp, current_timestamp)
      RETURNING username, password, first_name, last_name, phone`,
      [username, hashedPassword, first_name, last_name, phone]
    )

    return result.rows[0]
  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) { 
    const result = await db.query(`SELECT username,password FROM users WHERE username = $1`, 
    [username]
  )
    const user = result.rows[0]

    if(user){
      if(await bcrypt.compare(password, user.password)){
        return user
      } else {
        throw new ExpressError("Invalid password", 400)
      }
    }
    
    throw new ExpressError("Invalid username/password", 400)

  }

  static giveToken(username){
    const token = jwt.sign({username}, SECRET_KEY)
    return token
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    const result = await db.query(`UPDATE users SET last_login_at = current_timestamp WHERE username = $1 RETURNING username`,
      [username]
    )

    if(!result.rows[0]){
      throw new ExpressError(`Invalid username`, 404)
    }
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() { 
    const result = await db.query(`SELECT username, first_name, last_name, phone FROM users`)

    return result.rows; 
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) { 
    const result = await db.query(`SELECT username, first_name, last_name, phone, join_at, last_login_at from users WHERE username = $1`, 
      [username]
    )
    const user = result.rows[0]
    if(!user){
      throw new ExpressError(`User : ${username} does not exist`, 404)
    }

    return user

  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) { 
    const result = await db.query(
      `SELECT messages.id, 
      messages.to_username, 
      users.first_name, 
      users.last_name, 
      users.phone,
      messages.body,
      messages.sent_at,
      messages.read_at 
      FROM messages
      JOIN users ON messages.to_username = users.username
      WHERE from_username = $1`,
      [username]
    )
    return result.rows.map(m => ({
      id: m.id,
      to_user: {
        username: m.to_username,
        first_name: m.first_name,
        last_name: m.last_name,
        phone: m.phone
      },
      body: m.body,
      sent_at: m.sent_at,
      read_at: m.read_at
    }));
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) { 
    const result = await db.query(
      `SELECT messages.id,
      messages.from_username, 
      users.first_name, 
      users.last_name, 
      users.phone,
      messages.body,
      messages.sent_at,
      messages.read_at 
      FROM messages
      JOIN users ON messages.from_username = users.username
      WHERE to_username = $1`,
      [username]
    )
    return result.rows.map(m => ({
      id: m.id,
      from_user: {
        username: m.from_username,
        first_name: m.first_name,
        last_name: m.last_name,
        phone: m.phone,
      },
      body: m.body,
      sent_at: m.sent_at,
      read_at: m.read_at
    }));
  }
}



module.exports = User;