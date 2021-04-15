const getUserByEmail = function(email, database) {
  
  for (let key in database) {
  
    if (database[key].email === email) {
      return database[key];
    }
  }
  return null;
};

const userExists =  function (userID, database) {
  if (database[userID]) {
    return true;
  }
  return false;
};

module.exports = {getUserByEmail, userExists};

// const users = {
//   "userRandomID": {
//     id: "userRandomID",
//     email: "user@example.com",
//     password: "$2b$10$M8Pon/b2UEEkhNXoL.5VW.UE6x/pLo7RnnSTyFIzLg/4t0UIUOpqG" // purple-monkey-dinosaur
//   },

//////////////////////////////////// IMPLEMENT AND EXPORT ///////////////////////////////////////////