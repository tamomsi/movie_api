const jwtSecret = 'your_jwt_secret'; //the same key used in the JWTStrategy

const jwt = require('jsonwebtoken'),
  passport = require('passport');

require('./passport'); 

let generateJWTToken = (user) => {
  return jwt.sign(user, jwtSecret, {
    subject: user.UserName, 
    expiresIn: '7d', 
    algorithm: 'HS256' 
  });
}

module.exports = (router) => {
    router.post('/login', (req, res) => {
        passport.authenticate('local',{ session: false }, (error, user, info) => {
                console.log({error, user})
                if (error || !user) {
                    return res.status(400).json({
                        message: 'Something is not right',
                        user: user,
                        error
                    });
                }
                req.login(user, { session: false }, (error) => {
                    if (error) {
                        res.send(error);
                    }
                    let token = generateJWTToken(user.toJSON());
                    return res.json({ user, token });
                });
            })(req, res);
        });
}

