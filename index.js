const express = require('express');
const morgan = require('morgan');
const app = express();
const uuid = require('uuid');
const bodyParser = require('body-parser');

const mongoose = require('mongoose');
const Models = require('./models.js');

const Movies = Models.Movie;
const Users = Models.User;

/**
 * Connect to the MongoDB database
 * @param {string} process.env.CONNECTION_URI - MongoDB connection URI
 * @param {object} { useNewUrlParser: true, useUnifiedTopology: true } - Connection options
 */
mongoose.connect( process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });

/**
 * Middleware configuration
 */
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
 * Default route
 */
app.get('/', (req, res) => {
   res.send('Welcome to myFlix!');
});

app.get('/Movies', (req, res) => {
  /**
   * Retrieve all movies from the database
   * @returns {object} - All movies in the database
   * @throws {error} - Error if there's an issue retrieving the movies
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

app.get('/movies/:Title', passport.authenticate('jwt', { session: false }), (req, res) => {
  /**
   * Retrieve a movie by its title
   * @param {string} req.params.Title - The title of the movie to retrieve
   * @returns {object} - The movie with the specified title
   * @throws {error} - Error if there's an issue retrieving the movie
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

app.get('/movies/genre/:genreName', passport.authenticate('jwt', { session: false }), (req,res) => {
  /**
   * Retrieve genre information by genre name
   * @param {string} req.params.genreName - The name of the genre
   * @returns {object} - The genre information for the specified genre name
   * @throws {error} - Error if there's an issue retrieving the genre information
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

app.get('/movies/director/:directorName', passport.authenticate('jwt', { session: false }), (req,res) => {
  /**
   * Retrieve director information by director name
   * @param {string} req.params.directorName - The name of the director
   * @returns {object} - The director information for the specified director name
   * @throws {error} - Error if there's an issue retrieving the director information
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

app.get('/users', passport.authenticate('jwt', { session: false }), (req, res) => {
  /**
   * Retrieve all users
   * @returns {object} - All users in the database
   * @throws {error} - Error if there's an issue retrieving the users
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

app.get('/users/:UserName', passport.authenticate('jwt', { session: false }), (req, res) => {
  /**
   * Retrieve a user by username
   * @param {string} req.params.UserName - The username of the user to retrieve
   * @returns {object} - The user with the specified username
   * @throws {error} - Error if there's an issue retrieving the user
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

app.post('/users', 
[
    check('UserName', 'UserName is required').isLength({min: 5}),
    check('UserName', 'UserName contains non alphanumeric characters - not allowed.').isAlphanumeric(),
    check('Password', 'Password is required').not().isEmpty(),
    check('email', 'Valid email is required').isEmail()
], (req, res) => {
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

  /**
   * Create a new user
   * @param {string} req.body.UserName - The username of the new user
   * @param {string} req.body.Password - The password of the new user
   * @param {string} req.body.email - The email of the new user
   * @param {string} req.body.Birthday - The birthday of the new user
   * @returns {object} - The created user
   * @throws {error} - Error if there's an issue creating the user
   */
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

app.put('/users/:UserName', passport.authenticate('jwt', { session: false }),
[
        check('UserName', 'UserName is required').isLength({ min: 5 }),
        check('UserName', 'UserName contains non alphanumeric characters - not allowed.').isAlphanumeric(),
        check('Password', 'Password is required').not().isEmpty(),
        check('email', 'Valid email is required').isEmail()
    ], (req, res) => {
       let errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }
       
      /**
       * Update user information by username
       * @param {string} req.params.UserName - The username of the user to update
       * @param {string} req.body.UserName - The new username of the user
       * @param {string} req.body.Password - The new password of the user
       * @param {string} req.body.email - The new email of the user
       * @param {string} req.body.Birthday - The new birthday of the user
       * @returns {object} - The updated user
       * @throws {error} - Error if there's an issue updating the user
       */ 
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

app.post("/users/:UserName/movies/:MovieId", passport.authenticate('jwt', { session: false }), (req, res) => {
  /**
   * Add a movie to a user's favorites
   * @param {string} req.params.UserName - The username of the user
   * @param {string} req.params.MovieId - The ID of the movie to add to favorites
   * @returns {object} - The updated user with the added movie in favorites
   * @throws {error} - Error if there's an issue adding the movie to favorites
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

app.delete('/users/:UserName/movies/:MovieId', passport.authenticate('jwt', { session: false }), (req, res) => {
  /**
   * Remove a movie from a user's favorites
   * @param {string} req.params.UserName - The username of the user
   * @param {string} req.params.MovieId - The ID of the movie to remove from favorites
   * @returns {object} - The updated user with the removed movie from favorites
   * @throws {error} - Error if there's an issue removing the movie from favorites
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

app.delete('/users/:UserName', passport.authenticate('jwt', { session: false }), (req, res) => {
  /**
   * Delete a user by username
   * @param {string} req.params.UserName - The username of the user to delete
   * @returns {string} - A success message indicating the deletion of the user
   * @throws {error} - Error if there's an issue deleting the user
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

/**
 * Documentation route
 */
app.get('/documentation', (req, res) => {
    /**
     * Serve the documentation HTML file
     */
    res.sendFile('public/documentation.html', { root: __dirname });
});

/**
 * Error handling middleware
 */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Oops, something broke! Please try again later.');
});

/**
 * Start the server
 */
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0',() => {
 console.log('Listening on Port ' + port);
});