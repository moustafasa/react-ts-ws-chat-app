// const jwt = require("jsonwebtoken");
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// Define some constants
const ACESS_SECRET_KEY = `access-secret-key`; // The secret key for signing jwt tokens
const REFRESH_SECRET_KEY = "refresh-secret-key";

// const bcrypt = require("bcryptjs");

// A helper function to create a token from a payload
const createToken = (data, type) => {
  const payload = { ...data, date: (new Date() * Math.random()).toString(16) };
  if (type === "access") {
    return jwt.sign(payload, ACESS_SECRET_KEY, { expiresIn: "30m" });
  } else if (type === "refresh") {
    return jwt.sign(payload, REFRESH_SECRET_KEY, { expiresIn: "1d" });
  }
};

const setRefreshToken = (payload, res, db) => {
  const refresh = createToken(payload, "refresh");
  res.cookie("refreshToken", refresh, { httpOnly: true });
  db.get("data")
    .get("users")
    .find({ id: payload.id })
    .assign({ refresh })
    .write();
};

// A helper function to verify a token and get the decoded data
const verifyToken = (token, type) => {
  return jwt.verify(
    token,
    type === "access" ? ACESS_SECRET_KEY : REFRESH_SECRET_KEY,
    (err, decode) => (decode !== undefined ? decode : err)
  );
};

export const register = (db) => (req, res) => {
  // Get the user data from the request body
  const { name, email, password } = req.body;

  // Check if the username is already taken
  const existingUser = db
    .get("data")
    .get("users")
    .find({ email: email.toLowerCase() })
    .value();

  if (existingUser) {
    // Return a 409 Conflict response
    res.status(409).send("email already exists");
  } else {
    // Create a new user record
    const payload = {
      id: new Date().getTime().toString(16),
      name,
      email: email.toLowerCase(),
      rooms: [],
    };
    db.get("data")
      .get("users")
      .push({ ...payload, name, password, active: false, img: "string" })
      .write();

    // Create a token for the new user
    const token = createToken(payload, "access");

    setRefreshToken(payload, res, db);

    // Return a 201 Created response with the token
    res.status(201).json({ token });
  }
};

export const login = (db) => (req, res) => {
  // Get the credentials from the request body
  const { email, password } = req.body;

  // Find the user by username
  const user = db
    .get("data")
    .get("users")
    .find({ email: email.toLowerCase() })
    .value();

  if (user) {
    // Compare the password with the hashed one
    bcrypt.compare(password, user.password, (err, result) => {
      if (err) {
        // Handle comparison error
        res.status(500).send(err.message);
      } else {
        if (result) {
          const payload = {
            id: user.id,
            email: email.toLowerCase(),
            name: user.name,
            rooms: user.rooms,
          };
          // Passwords match, create a token for the user
          const token = createToken(payload, "access");
          // set refresh token in database and coockie
          setRefreshToken(payload, res, db);
          // Return a 200 OK response with the token
          res.status(200).json({ token });
        } else {
          // Passwords don't match, return a 401 Unauthorized response
          res.status(401).send("Invalid credentials");
        }
      }
    });
  } else {
    // User not found, return a 404 Not Found response
    res.status(401).send("User not found");
  }
};

export const refresh = (db) => (req, res) => {
  // Get the refresh token from the cookie
  const refreshToken = req.cookies.refreshToken;

  // Verify the refresh token
  const decoded = verifyToken(refreshToken, "refresh");

  // Check if the refresh token is valid and not expired
  if (decoded && !decoded.message) {
    // Find the user by id
    const user = db.get("data").get("users").find({ id: decoded.id }).value();

    // Check if the refresh token matches the one in the database
    if (user && user.refresh === refreshToken) {
      // Create a new access token
      const token = createToken(
        {
          id: user.id,
          email: user.email,
          name: user.name,
          rooms: user.rooms,
        },
        "access"
      );

      // Token is valid, set the user id  in the request object
      req.userId = decoded.id;
      // Return a 200 OK response with the new access token
      res.status(200).json({ token });
    } else {
      // Refresh token does not match, return a 401 Unauthorized response
      res.status(401).send("Invalid refresh token");
    }
  } else {
    // Refresh token is invalid or expired, return a 401 Unauthorized response
    res.status(401).send("Invalid refresh token");
  }
};

export const logout = (db) => (req, res) => {
  const refresh = req.cookies.refreshToken;
  if (!refresh) {
    res.status(204);
  } else {
    res.clearCookie("refreshToken", { httpOnly: true });
    const user = db.get("data").get("users").find({ refresh });
    if (!user.value()) {
      res.sendStatus(204);
    } else {
      const userValue = user.value();
      delete userValue.refresh;
      user.assign({ ...userValue }).write();
      res.sendStatus(204);
    }
  }
};

export const authenticate = (token, onSuccess, onFail) => {
  // Verify the token and get the decoded data
  const decoded = verifyToken(token, "access");
  // Check if the token is valid
  if (decoded && !decoded.message) {
    onSuccess(decoded);
  } else {
    onFail();
  }
};
