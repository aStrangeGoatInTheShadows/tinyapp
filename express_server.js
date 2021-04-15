const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');

const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

const errors = {
  noPass: `The password can't be blank`,
  noEmail: `The email can't be blank`
}

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
    res.redirect("/register");
    return;
  }

  if (users.emailExists(newEmail)) {
    res.status(406).send(`an account is already registered with ${newEmail}`);
    res.redirect("/register");
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
  res.cookie('user_id', newUserID);

console.log(users[newUserID]);

  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  let userID = users.emailExists(req.body.userEmail);

  // If user doesn't exist set error cookie to say so
  if (!userID) {
    res.cookie('error', `User account doesn't exist for ${req.body.userEmail}`);
    res.redirect("/login");
    return;
  }

  //console.log(`LOGIN PAGE : isUsersPassword ${users.isUsersPassword(userID, req.body.userPassword)}`)

  // If users password is invalid, throw an error
  if (!users.isUsersPassword(userID, req.body.userPassword)) {
    res.status(401).send(`These credentials do not match an account`);
    console.log('someone tried to login with a correct username and wrong password');
    return;
  }
  res.cookie('user_id', userID);

  res.redirect("/urls");
})

app.get("/login", (req, res) => {

  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies.user_id],
    error: req.cookies.error,
    errors
  };

  if (templateVars.error) {
    console.log(`Registration Error = ${templateVars.error}`);
  }
  res.clearCookie('error');
  ////// CLEAR ERROR COOKIE //////////

  res.render("login", templateVars);
});

app.get("/register", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies.user_id],
    error: req.cookies.error,
    errors
  };

  if (templateVars.error) {
    console.log(`Registration Error = ${templateVars.error}`);
  }
  res.clearCookie('error');
  ////// CLEAR ERROR COOKIE //////////

  res.render("register", templateVars);
});




// Sends urls_index to browser
app.get("/urls", (req, res) => {
  const userID = req.cookies.user_id;
  // console.log(urlDatabase);

  const templateVars = {
    urls: urlDatabase,
    user: users[userID]
  };

  if (!users.userExists(req.cookies.user_id)) {
    console.log(`The existing cookie doesn't match a known user and has been cleared`);
    res.clearCookie('user_id');
  }
  res.render("urls_index", templateVars);
});

// Sends a blank page to index
app.get("/", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies.user_id]
  };

  res.render("urls_index", templateVars);
});

// Clears the cookie to logout the user
app.post(`/logout`, (req, res) => {
  res.clearCookie('user_id');
  res.redirect("/urls");
});



// deletes a data base entry for a TinyURL
app.post(`/urls/:shortURL/delete`, (req, res) => {
  const shortURL = res.shortURL;
  const userID = req.cookies.user_id;
  
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
    userID: req.cookies.user_id
  };
  //////////////////////////////// TEST TO MAKE SURE A VALID URL ////////////////////////////////
  // if (req.body.longURL.startsWith('http')) {
  // } else {
  //   const newLongURL = {longURL: `http://${req.body.longURL}`};
  // }
  urlDatabase[randomString] = obj;


  //console.log(urlDatabase);
  console.log(`${randomString} now links too ${req.body.longURL}`);  // Log the POST request body to the console
  res.redirect('urls');
});

// GET for redirect of short URL
app.get("/u/:shortURL", (req, res) => {
const shortURL = req.params.shortURL;


  if (!urlDatabase[shortURL]) {
    res.cookie('error', 'There is no URL for this!');
    //console.log('NO URL FOR REDIRECT');
    res.redirect('/urls');
    return;
  }

  const longURL = urlDatabase[shortURL].longURL;
  console.log(`User redirected to ${longURL}`)
  res.redirect(longURL);
});

// Page for making new urls if a user is logged in
app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users[req.cookies.user_id],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL]
  };

  if (templateVars.user) {
    res.render("urls_new", templateVars);
    return;
  }
  res.cookie('error', 'you must be logged in to create tiny urls');

  res.redirect('/login');
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    user: users[req.cookies.user_id],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL]
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