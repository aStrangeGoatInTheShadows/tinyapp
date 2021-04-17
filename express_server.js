const helpers = require('./helpers');
const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(cookieSession({
  name: 'frankIsDank',
  keys: [
    'BABYBUMPERDINOSAUR',
    "NRANOWAY",
    'CODINGISAMAZING'
  ],
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));


const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: 'userRandomID' },
  "9sm5xK": { longURL: "http://www.google.com", userID: 'userRandomID' },
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "$2b$10$M8Pon/b2UEEkhNXoL.5VW.UE6x/pLo7RnnSTyFIzLg/4t0UIUOpqG" // purple-monkey-dinosaur
  },

  userExists: function(user) {
    if (this[user]) {
      return true;
    }
    return false;
  },

  isUsersPassword: function(id, password) {
    if (bcrypt.compareSync(password, this[id].password)) {
      return true;
    }
    return false;
  },

  emailExists: function(email) {
    for (let key in this) {
      if (this[key].email === email) {
        return key;
      }
    }
    return false;
  }
};

// processes adding a user to the data base
app.post("/register", (req, res) => {
  const newEmail = req.body.userEmail;
  let user = helpers.getUserByEmail(newEmail, users) || null;
  const newPassword = req.body.userPassword;

  if (newEmail.length === 0 || newPassword.length === 0) {
    res.status(406).send(`The field's cannot be blank`);
    return;
  }
  if (user) {
    if (users.isUsersPassword(user.id, newPassword)) {
      req.session.user_id = user.id;
      res.redirect('/urls');
      return;
    }

    res.status(406).send(`an account is already registered with ${newEmail}`);
    return;
  }

  const newUserID = generateRandomString(10);

  const hashedPassword = bcrypt.hashSync(newPassword, 10);

  users[newUserID] = {
    id: newUserID,
    email: newEmail,
    password: hashedPassword
  };

  res.redirect("/login");
});


app.post("/login", (req, res) => {
  let email = req.body.userEmail;
  let userObj = helpers.getUserByEmail(email, users);
  let userID = userObj.id || null;

  // If user doesn't exist send error
  if (!userObj) {
    res.status(401).send(`User account doesn't exist for ${req.body.userEmail}`);
    return;
  }

  // If users password is invalid, throw an error
  if (!users.isUsersPassword(userID, req.body.userPassword)) {
    res.status(401).send(`These credentials do not match an account`);
    return;
  }

  req.session.user_id = userID;

  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  // If a user doesn't exist for the given cookie info
  if (helpers.userExists(req.session.user_id, users)) {
    res.redirect('/urls');
    return;
  }

  const templateVars = {
    urls: urlDatabase,
    user: users[req.session.user_id],
    error: null,
  };

  res.render("login", templateVars);
});

app.get("/register", (req, res) => {
  // If a user doesn't exist for the given cookie info
  if (helpers.userExists(req.session.user_id, users)) {
    res.redirect('/urls');
    return;
  }

  const templateVars = {
    urls: urlDatabase,
    user: users[req.session.user_id]
  };

  res.render("register", templateVars);
});

// Sends urls_index to browser
app.get("/urls", (req, res) => {
  const userID = req.session.user_id;
  let userEmail = null;

  if (helpers.userExists(userID, users)) {
    userEmail = users[userID].email;
  }

  if (!helpers.getUserByEmail(userEmail, users)) {
    res.status(401).send('You must be logged in to see a URL List');
    //res.redirect('/login');
    return;
  }

  const templateVars = {
    urls: urlDatabase,
    user: users[userID]
  };

  res.render("urls_index", templateVars);
});

// Sends a blank page to index
app.get("/", (req, res) => {
  const userID = req.session.user_id || null;

  const templateVars = {
    urls: urlDatabase,
    user: users[userID]
  };

  if (!userID) {
    res.redirect('/login');
    return;
  }

  res.render("urls_index", templateVars);
});

// Clears the cookie to logout the user
app.post(`/logout`, (req, res) => {
  req.session = null;
  res.redirect("/login");
});



// deletes a data base entry for a TinyURL
app.post(`/urls/:shortURL/delete`, (req, res) => {
  const userID = req.session.user_id;

  if (!users.userExists(userID)) {
    return;
  }
  delete urlDatabase[req.params.shortURL];

  res.redirect("/urls");
});

// Logic for making new urls
app.post("/urls", (req, res) => {
  let randomString = generateRandomString();

  // if entry exists, update database
  if (urlDatabase[req.body.shortURL]) {
    randomString = req.body.shortURL;
  }
  const obj = {
    longURL: `${req.body.longURL}`,
    userID: req.session.user_id
  };

  urlDatabase[randomString] = obj;

  res.redirect(`/urls/${randomString}`);
});

// GET for redirect of short URL
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;

  // If doesn't match to a data base entry
  if (!urlDatabase[shortURL]) {
    res.status(404).send(`this doesn't match a url in the database`);
    return;
  }

  const longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});

// Page for making new urls if a user is logged in
app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL]
  };

  if (templateVars.user) {
    res.render("urls_new", templateVars);
    return;
  }

  res.redirect('/login');
});

app.get("/urls/:shortURL", (req, res) => {
  const userID = req.session.user_id || null;

  if (!urlDatabase[req.params.shortURL]) {
    res.status(400).send(`That's an invalid short url`);
    return;
  }

  if (!userID) {
    res.status(401).send(`You must be logged in to access this page`);
    return;
  }

  if (userID !== urlDatabase[req.params.shortURL].userID) {
    res.status(403).send(`Your not permitted to edit other users links`);
    return;
  }

  const templateVars = {
    user: users[userID],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL
  };

  res.render("urls_show", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// Generously donated by https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
const generateRandomString = function(length) {
  length = (typeof length !== 'undefined') ? length : 6;
  let result = [];
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  const stringLength = length;

  for (let i = 0; i < stringLength; i++) {
    result.push(characters.charAt(Math.floor(Math.random() * charactersLength)));
  }
  return result.join('');
};