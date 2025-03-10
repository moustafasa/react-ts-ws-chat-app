import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10; // The number of salt rounds for hashing passwords

export const hashPassword = (req, res, next) => {
  if (
    ["POST", "PUT"].includes(req.method) &&
    req.path !== "/login" &&
    req.body.password
  ) {
    // Hash the password with bcrypt
    bcrypt.hash(req.body.password, SALT_ROUNDS, (err, hash) => {
      if (err) {
        // Handle hashing error
        res.status(500).send(err.message);
      } else {
        // Replace the plain password with the hashed one
        req.body.password = hash;
        next();
      }
    });
  } else {
    next();
  }
};
