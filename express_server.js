const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const helpers = require('./helpers');

const express = require("express");
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
}))


/////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////
// You've done zero curl test's as you did not understand the value
// Start testing using curl 
/////// REFERENCE ////////////////////////////////////////////
// curl -X POST -i localhost:8080/urls/sgq3y6/delete
// As this test shows, removing the "Edit" and "Delete" buttons from our front end does not
// prevent someone from accessing our POST /urls/:id or POST /urls/:id/delete routes.

// FROM ASSIGNMENT 
//  Update the edit and delete endpoints such that only the owner (creator) of the URL can edit or delete
//  the link. Use a testing utility like cURL to confirm that if a user is not logged in, they cannot edit or
//  delete URLs.

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


  userExists: function (user) {
    if (this[user]) {
      return true;
    }
    return false;
  },

  isUsersPassword: function (id, password) {
    if (bcrypt.compareSync(password, this[id].password)) {
      return true;
    }
    return false;
  },

  emailExists: function (email) {
    for (let key in this) {
      if (this[key].email === email) {
        return key;
      }
    }
    return false;
  }
}

// processes adding a user to the data base
app.post("/register", (req, res) => {
  let userID = null;
  const newEmail = req.body.userEmail;
  const newPassword = req.body.userPassword;

  if (newEmail.length === 0 || newPassword.length === 0) {
    res.status(406).send(`The field's cannot be blank`); ///???
    return;
  }
  if (helpers.getUserByEmail(newEmail, users)) {
    res.status(406).send(`an account is already registered with ${newEmail}`);
    return;
  };
  
  //As per Gary this is unnecessary for this proj
  // Do while none unique user name
  do {
    let escape = true;
    newUserID = generateRandomString(10);
    escape = users[userID];
  } while (!escape)
  
  const hashedPassword = bcrypt.hashSync(newPassword, 10);
  
  users[newUserID] = {
    id: newUserID,
    email: newEmail,
    password: hashedPassword
  }
  
  res.redirect("/login");
});


app.post("/login", (req, res) => {
  let email = req.body.userEmail;
  let userObj = helpers.getUserByEmail(email, users);
  let userID = null;;
  if(userObj) {
    userID = userObj.id;
  }
  
  // If user doesn't exist send error
  if (!userObj) {
    res.status(401).send(`User account doesn't exist for ${req.body.userEmail}`)
    return;
  }
  
  //console.log(`LOGIN PAGE : isUsersPassword ${users.isUsersPassword(userID, req.body.userPassword)}`)
  
  // If users password is invalid, throw an error
  if (!users.isUsersPassword(userID, req.body.userPassword)) {
    res.status(401).send(`These credentials do not match an account`);
    console.log('someone tried to login with a correct username and wrong password');
    return;
  }

  req.session.user_id = userID;

  res.redirect("/urls");
})

app.get("/login", (req, res) => {

  // If a user doesn't exist for the given cookie info
  if(helpers.userExists(req.session.user_id, users)){
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
  const templateVars = {
    urls: urlDatabase,
    user: users[req.session.user_id]
  };

  res.render("register", templateVars);
});

// Sends urls_index to browser
app.get("/urls", (req, res) => {
  const userID = req.session.user_id;
  const user = null;
  let userEmail = null;

  if(helpers.userExists(userID, users)) {
    console.log('user exists');
    userEmail = users[userID].email;
  }

  if(!helpers.getUserByEmail(userEmail, users)){
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
  const shortURL = res.shortURL;
  const userID = req.session.user_id;

  if (!users.userExists(userID)) {
    return
  }
  ////////////////////////////////////////Currently Outputting undefined///////////////////////////////////////////////////
  console.log(`${shortURL}'s link to ${urlDatabase[shortURL]} has been deleted.`);
  delete urlDatabase[req.params.shortURL];

  res.redirect("/urls");
});

// Logic for making new urls
app.post("/urls", (req, res) => {
  let randomString = generateRandomString();
  // if entry exists, update database
  // console.log(req.body);
  if (urlDatabase[req.body.shortURL]) {
    randomString = req.body.shortURL;
  }
  const obj = {
    longURL: `${req.body.longURL}`,
    userID: req.session.user_id
  };
  //////////////////////////////// TEST TO MAKE SURE A VALID URL ////////////////////////////////
  // if (req.body.longURL.startsWith('http')) {
  // } else {
  //   const newLongURL = {longURL: `http://${req.body.longURL}`};
  // }
  urlDatabase[randomString] = obj;


  //console.log(urlDatabase);
  console.log(`${randomString} now links too ${req.body.longURL}`);  // Log the POST request body to the console
  res.redirect(`/urls/${randomString}`);
});

// GET for redirect of short URL
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;


  if (!urlDatabase[shortURL]) {    
    res.status(404).send(`this doesn't match a url in the database`);
    //console.log('NO URL FOR REDIRECT');
    return;
  }

  const longURL = urlDatabase[shortURL].longURL;
  console.log(`User redirected to ${longURL}`)
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

  if(!urlDatabase[req.params.shortURL]) {
    res.status(400).send(`That's an invalid short url`);
    return;
  }

  if(!userID) {
    res.status(401).send(`You must be logged in to access this page`);
    return;
  }

  if(userID !== urlDatabase[req.params.shortURL].userID) {
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
function generateRandomString(length) {
  length = (typeof length !== 'undefined') ? length : 6;
  let result = [];
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  const stringLength = length;


  for (var i = 0; i < stringLength; i++) {
    result.push(characters.charAt(Math.floor(Math.random() * charactersLength)));
  }
  return result.join('');
}