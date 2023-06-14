const jwtSecret = 'your_jwt_secret'; //the same key used in the JWTStrategy

const jwt = require('jsonwebtoken'),
  passport = require('passport');

require('./passport');  // Your local passport file

/**
 * Generate a JWT token for the provided user
 * @param {object} user - The user object to generate the token for
 * @returns {string} - The generated JWT token
 */
let generateJWTToken = (user) => {
  return jwt.sign(user, jwtSecret, {
    subject: user.UserName, // This is the username you’re encoding in the JWT
    expiresIn: '7d', // This specifies that the token will expire in 7 days
    algorithm: 'HS256' // This is the algorithm used to “sign” or encode the values of the JWT
  });
}

/**
 * Authenticate user credentials and generate a JWT token upon successful login
 * @param {object} router - The Express router object
 */
module.exports = (router) => {
  /**
   * POST login route
   * @param {object} req - The Express request object
   * @param {object} res - The Express response object
   */
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
