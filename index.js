const express = require('express');
const morgan = require('morgan');
const app = express();
const uuid = require('uuid');
const bodyParser = require('body-parser');

const mongoose = require('mongoose');
const Models = require('./models.js');

const Movies = Models.Movie;
const Users = Models.User;

//mongoose.connect('mongodb://localhost:27017/cfDB', { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connect( process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(bodyParser.json());
app.use(express.static('public'));
app.use(morgan('common'));
app.use(bodyParser.urlencoded({
  extended: true
}));

const { check, validationResult } = require('express-validator');

const cors = require('cors');
app.use(cors());

let auth = require('./auth')(app);

const passport = require('passport');
require('./passport');

/**
 * Route handler for the home page.
 * @name GET /
 * @function
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
app.get('/', (req, res) => {
   res.send('Welcome to myFlix!');
});

//return JSON object for movies
app.get('/Movies', passport.authenticate('jwt', { session: false }), (req, res) => {
    /**
   * Retrieves all movies from the database.
   * @name GET /Movies
   * @inner
   * @function
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   */
  Movies.find()
  .then((movies) => {
    res.status(201).json(movies);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('Error: ' + err);
  });
});

//get movies by title
app.get('/movies/:Title', passport.authenticate('jwt', { session: false }), (req, res) => {
    /**
   * Retrieves a movie by title from the database.
   * @name GET /movies/:Title
   * @inner
   * @function
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   */
  Movies.findOne({ Title: req.params.Title })
  .then((movie) => {
    res.json(movie);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('error: ' + err);
  });
});

//info about genre by genre name
app.get('/movies/genre/:genreName', passport.authenticate('jwt', { session: false }), (req,res) => {
    /**
   * Retrieves genre information by genre name from the database.
   * @name GET /movies/genre/:genreName
   * @inner
   * @function
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   */
  Movies.findOne({'Genre.Name':req.params.genreName })
  .then((movie) => {
      res.json(movie.Genre);
  })
  .catch((err) => {
      console.error(err);
      res.status(500).send('Error:' + err);
  });
});

//info about directors by their name
app.get('/movies/director/:directorName', passport.authenticate('jwt', { session: false }), (req,res) => {
  /**
   * Retrieves director information by director name from the database.
   * @name GET /movies/director/:directorName
   * @inner
   * @function
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   */
  Movies.findOne({ 'Director.Name': req.params.directorName})
  .then((movie) => {
      res.json(movie.Director);
  })
  .catch((err) => {
      console.error(err);
      res.status(500).send('Error:' + err);
  });
});

// Get all users
app.get('/users', passport.authenticate('jwt', { session: false }), (req, res) => {
  /**
   * Retrieves all users from the database.
   * @name GET /users
   * @inner
   * @function
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   */
  Users.find()
    .then((users) => {
      res.status(201).json(users);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// Get a user by username
app.get('/users/:UserName', passport.authenticate('jwt', { session: false }), (req, res) => {
  /**
   * Retrieves a user by username from the database.
   * @name GET /users/:UserName
   * @inner
   * @function
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   */
  Users.findOne({ UserName: req.params.UserName })
    .then((user) => {
      res.json(user);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

//add a new user
app.post('/users', 
[
    check('UserName', 'UserName is required').isLength({min: 5}),
    check('UserName', 'UserName contains non alphanumeric characters - not allowed.').isAlphanumeric(),
    check('Password', 'Password is required').not().isEmpty(),
    check('email', 'Valid email is required').isEmail()
], (req, res) => {
    /**
     * Creates a new user in the database.
     * @name POST /users
     * @inner
     * @function
     * @param {Object} req - Express request object.
     * @param {Object} res - Express response object.
     */
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

 let hashedPassword = Users.hashPassword(req.body.Password);
  Users.findOne({ UserName: req.body.UserName })
    .then((user) => {
      if (user) {
        return res.status(400).send(req.body.UserName + 'already exists');
      } else {
        Users
          .create({
            UserName: req.body.UserName,
            Password: hashedPassword,
            email: req.body.email,
            Birthday: req.body.Birthday
          })
          .then((user) =>{res.status(201).json(user) })
        .catch((error) => {
          console.error(error);
          res.status(500).send('Error: ' + error);
        })
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send('Error: ' + error);
    });
});

// Update a user's info, by username
app.put('/users/:UserName', passport.authenticate('jwt', { session: false }),
[
        check('UserName', 'UserName is required').isLength({ min: 5 }),
        check('UserName', 'UserName contains non alphanumeric characters - not allowed.').isAlphanumeric(),
        check('Password', 'Password is required').not().isEmpty(),
        check('email', 'Valid email is required').isEmail()
    ], (req, res) => {
    /**
     * Updates a user's information in the database by username.
     * @name PUT /users/:UserName
     * @inner
     * @function
     * @param {Object} req - Express request object.
     * @param {Object} res - Express response object.
     */
       let errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

      let hashedPassword = Users.hashPassword(req.body.Password);
      Users.findOneAndUpdate({ UserName: req.params.UserName }, { $set:
    {
      UserName: req.body.UserName,
      Password: hashedPassword,
      email: req.body.email,
      Birthday: req.body.Birthday
    }
  },
  { new: true },)
  .then((updatedUser) => {
    res.json(updatedUser);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send("Error: " + err);
  });
});

//add a new movie to favs
app.post("/users/:UserName/movies/:MovieId", passport.authenticate('jwt', { session: false }), (req, res) => {
  /**
   * Adds a movie to a user's list of favorite movies in the database.
   * @name POST /users/:UserName/movies/:MovieId
   * @inner
   * @function
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   */
  Users.findOneAndUpdate(
    { UserName: req.params.UserName },
    {
      $push: { FavoriteMovies: req.params.MovieId },
    },
    { new: true }
  )
    .then((updatedUser) => {
      res.json(updatedUser);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error: " + err);
    });
});

//remove a movie from their list of favorites
app.delete('/users/:UserName/movies/:MovieId', passport.authenticate('jwt', { session: false }), (req, res) => {
   /**
   * Removes a movie from a user's list of favorite movies in the database.
   * @name DELETE /users/:UserName/movies/:MovieId
   * @inner
   * @function
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   */
  Users.findOneAndUpdate({ UserName: req.params.UserName }, {
     $pull: { FavoriteMovies: req.params.MovieId }
   },
   { new: true }
  )
    .then((updatedUser) => {
      res.json(updatedUser);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error: " + err);
    });
});

// Delete a user by username
app.delete('/users/:UserName', passport.authenticate('jwt', { session: false }), (req, res) => {
  /**
   * Deletes a user from the database by username.
   * @name DELETE /users/:UserName
   * @inner
   * @function
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   */
  Users.findOneAndRemove({ UserName: req.params.UserName })
    .then((user) => {
      if (!user) {
        res.status(400).send(req.params.UserName + ' was not found');
      } else {
        res.status(200).send(req.params.UserName + ' was deleted.');
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});
      
app.get('/documentation', (req, res) => {
  /**
   * Sends the documentation file.
   * @name GET /documentation
   * @inner
   * @function
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   */
    res.sendFile('public/documentation.html', { root: __dirname });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Oops, something broke! Please try again later.');
});

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0',() => {
 console.log('Listening on Port ' + port);
});