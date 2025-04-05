import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Users from "../models/Users.js";

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

const setRefreshToken = async (payload, res) => {
  const refresh = createToken(payload, "refresh");
  res.cookie("refreshToken", refresh, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });
  const user = await Users.findOne({ email: payload.email });
  user.refresh = refresh;
  await user.save();
};

// A helper function to verify a token and get the decoded data
const verifyToken = (token, type) => {
  return jwt.verify(
    token,
    type === "access" ? ACESS_SECRET_KEY : REFRESH_SECRET_KEY,
    (err, decode) => (decode !== undefined ? decode : err)
  );
};

export const register = async (req, res) => {
  // Get the user data from the request body
  const { name, email, password } = req.body;

  // Check if the username is already taken
  const existingUser = await Users.findOne({ email: email.toLowerCase() });

  if (existingUser) {
    // Return a 409 Conflict response
    res.status(409).send("email already exists");
  } else {
    // Create a new user record
    const payload = {
      name,
      email: email.toLowerCase(),
    };
    const user = await Users.create({ ...payload, password });
    payload.id = user._id.toString();

    // Create a token for the new user
    const token = createToken(payload, "access");
    req.userId = payload.id;

    await setRefreshToken(payload, res);

    // Return a 201 Created response with the token
    res.status(201).json({ token });
  }
};

export const login = async (req, res) => {
  // Get the credentials from the request body
  const { email, password } = req.body;

  // Find the user by username
  const user = await Users.findOne({ email: email.toLowerCase() });

  if (user) {
    // Compare the password with the hashed one
    bcrypt.compare(password, user.password, async (err, result) => {
      if (err) {
        // Handle comparison error
        res.status(500).send(err.message);
      } else {
        if (result) {
          const payload = {
            id: user._id.toString(),
            email: email.toLowerCase(),
            name: user.name,
          };
          // Passwords match, create a token for the user
          const token = createToken(payload, "access");
          // set refresh token in database and coockie
          await setRefreshToken(payload, res);
          req.userId = payload.id;
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

export const refresh = async (req, res) => {
  // Get the refresh token from the cookie
  const refreshToken = req.cookies.refreshToken;

  // Verify the refresh token
  const decoded = verifyToken(refreshToken, "refresh");

  // Check if the refresh token is valid and not expired
  if (decoded && !decoded.message) {
    // Find the user by id
    const user = await Users.findOne({ email: decoded.email.toLowerCase() });

    // Check if the refresh token matches the one in the database
    if (user && user.refresh === refreshToken) {
      // Create a new access token
      const token = createToken(
        {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        "access"
      );

      // Token is valid, set the user id  in the request object
      req.userId = decoded.id;
      // Return a 200 OK response with the new access token
      res.status(200).json({ token });
    } else {
      res.clearCookie("refreshToken", { httpOnly: true });
      user.refresh = undefined;
      await user.save();

      // Refresh token does not match, return a 401 Unauthorized response
      res.status(401).send("Invalid refresh token");
    }
  } else {
    res.clearCookie("refreshToken", { httpOnly: true });
    // Refresh token is invalid or expired, return a 401 Unauthorized response
    res.status(401).send("Invalid refresh token");
  }
};

export const logout = async (req, res) => {
  const refresh = req.cookies.refreshToken;
  req.userId = undefined;

  if (!refresh) {
    res.status(204);
  } else {
    res.clearCookie("refreshToken", { httpOnly: true });
    const user = await Users.findOne({ refresh }, "refresh");
    if (!user.refresh) {
      res.sendStatus(204);
    } else {
      user.refresh = undefined;
      await user.save();
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
