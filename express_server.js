const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/register", (req, res) => {
  const templateVars = { 
    urls: urlDatabase,
    username: req.cookies.username
  };

  res.render("register", templateVars);
});

app.get("/urls", (req, res) => {
  const templateVars = { 
    urls: urlDatabase,
    username: req.cookies.username
  };

  res.render("urls_index", templateVars);
});

// Sends a blank page to index
app.get("/", (req, res) => {
  const templateVars = { 
    urls: urlDatabase,
    username: req.cookies["username"]
  };
  
  res.render("urls_index", templateVars);
});

//Creates a cookie to save the user
app.post(`/login`, (req, res) => {
  res.cookie('username', req.body.username);

  res.redirect("/urls");
});

// Clears the cookie to logout the user
app.post(`/logout`, (req, res) => {
  res.clearCookie('username');
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

  if(req.body.longURL.startsWith('http')){
    urlDatabase[randomString] = req.body.longURL;
  } else {
    urlDatabase[randomString] = `http://${req.body.longURL}`;
  }
  
  console.log(`${randomString} now links too ${req.body.longURL}`);  // Log the POST request body to the console
  res.redirect('urls');  
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  console.log (`User redirected to ${longURL}`)
  res.redirect(longURL);
});

// Page for making new urls
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { 
    username: req.cookies["username"],
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
function generateRandomString() {
  let result = [];
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  const stringLength = 6;


  for (var i = 0; i < stringLength; i++) {
    result.push(characters.charAt(Math.floor(Math.random() * charactersLength)));
  }
  return result.join('');
}