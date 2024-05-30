/** Common config for message.ly */

// read .env files and make environmental variables

require("dotenv").config();

const DB_URI = (process.env.NODE_ENV === "test")
  ? "postgresql:///messagely_test"
  : "postgresql:///messagely";

const DB_TYPE = (process.env.NODE_ENV === "test")
  ? "messagely_test"
  : "messagely";

const SECRET_KEY = process.env.SECRET_KEY ;

const BCRYPT_WORK_FACTOR = 12;


module.exports = {
  DB_TYPE,
  SECRET_KEY,
  BCRYPT_WORK_FACTOR,
};