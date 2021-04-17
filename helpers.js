const getUserByEmail = function(email, database) {
  
  for (let key in database) {
  
    if (database[key].email === email) {
      return database[key];
    }
  }
  return null;
};

const userExists = function(userID, database) {
  if (database[userID]) {
    return true;
  }
  return false;
};

module.exports = {getUserByEmail, userExists};