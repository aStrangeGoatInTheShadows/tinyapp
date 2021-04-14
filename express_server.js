const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

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

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  },
  "randomLoser": {
    id: "randomLoser",
    email: "insecurealphamale@hotmale.com",
    password: "kittiecrusher"
  },

  // userExists : function (user) {
  //     if (this[key]) {
  //       return true;
  //     }
  //     return false;
  // },

  isUsersPassword: function (id, password) {
    if (this[id].password === password) {
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

  if (req.body.userEmail.length === 0 || req.body.userPassword.length === 0) {
    res.cookie('error', `the fields can't be blank`);
    //res.status(400); ///???
    res.redirect("/register");
    return;
  }

  if (users.emailExists(req.body.userEmail)) {
    res.cookie('error', `an account is already registered with ${req.body.userEmail}`);
    res.redirect("/register");
    return;
  };

  //As per Gary this is unnecessary for this proj
  // Do while none unique user name
  do {
    let escape = true;
    userID = generateRandomString(10);
    escape = users[userID];
  } while (!escape)

  users[userID] = {
    id: userID,
    email: req.body.userEmail,
    password: req.body.userPassword
  }
  res.cookie('user_id', userID);

  res.redirect("/urls");
});

///////////////////////////////////////////////////// WORKING HERE ////////////////////////////////////////

app.post("/login", (req, res) => {
  let userID = users.emailExists(req.body.userEmail);

  // If user doesn't exist set error cookie to say so
  if (!userID) {
    res.cookie('error', `User account doesn't exist for ${req.body.userEmail}`);
    res.redirect("/login");
    return;
  }

  //////////////////////////////////////// TEST PASSWORD

  //console.log(`LOGIN PAGE : isUsersPassword ${users.isUsersPassword(userID, req.body.userPassword)}`)

  // If user doesn't exist set error cookie to say so
  if (!users.isUsersPassword(userID, req.body.userPassword)) {
    res.cookie('error', `These credentials do not match an account`);
    res.redirect("/login");
    return;
  }
  res.cookie('user_id', userID);

  res.redirect("/urls");
})

app.get("/login", (req, res) => {
  console.log(users);

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
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies.user_id]
  };
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
  console.log(`${res.shortURL}'s link to ${urlDatabase[res.shortURL]} has been deleted.`);

  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

// Logic for making new urls
app.post("/urls", (req, res) => {
  let randomString = generateRandomString();
  // if entry exists, update database
  console.log(req.body);
  if (urlDatabase[req.body.shortURL]) {
    randomString = req.body.shortURL;
  }

  if (req.body.longURL.startsWith('http')) {
    urlDatabase[randomString] = req.body.longURL;
  } else {
    urlDatabase[randomString] = `http://${req.body.longURL}`;
  }

  console.log(`${randomString} now links too ${req.body.longURL}`);  // Log the POST request body to the console
  res.redirect('urls');
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  console.log(`User redirected to ${longURL}`)
  res.redirect(longURL);
});

// Page for making new urls
app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users[req.cookies.user_id],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL]
  };

  res.render("urls_new", templateVars);
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