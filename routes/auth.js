/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/

const express = require("express");
const router = express.Router();

const ExpressError = require("../expressError")
const User = require("../models/user")


/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */


router.post('/register', async(req,res,next)=>{
    try{
        const {username, password, first_name, last_name, phone} = req.body
        if(!username || !password || !first_name || !last_name || !phone){
            throw new ExpressError("Missing Required Data", 400)
            }

        const user = await User.register(username, password, first_name, last_name, phone )
        let token = User.giveToken(user.username)
        User.updateLoginTimestamp(user.username)

        return res.json({'token': token})

    } catch(e){
        if(e.code === '23505'){
            return next (new ExpressError("username Taken", 400))
        }
        next(e)
    }
})

router.post('/login', async(req,res,next) =>{
    try{
        const {username, password} = req.body
        if(!username || !password){
          throw new ExpressError("Username and password required", 400);
        }

        const loggedIn = await User.authenticate(username, password)

        if(loggedIn){
            let token = User.giveToken(username)
            User.updateLoginTimestamp(username)
            return res.json({token})
        }

        throw new ExpressError("Invalid username/password", 400)

    } catch(e){
        next(e)
    }
})

module.exports = router;