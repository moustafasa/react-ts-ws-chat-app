import { authenticate } from "../controllers/authControllers.js";

// A middleware to check the authorization header for a valid token
export const checkAuth = (req, res, next) => {
  // Get the authorization header from the request
  const authorization = req.headers.authorization || req.headers.Authorization;
  if (req.path !== "/refresh") {
    // Check if the authorization header is present and has the format 'Bearer token'
    if (authorization && authorization.split(" ")[0] === "Bearer") {
      // Get the token from the authorization header
      const token = authorization.split(" ")[1];

      // on error success
      const onSuccess = (decoded) => {
        // Token is valid, set the user id  in the request object
        req.userId = decoded.id;
        next();
      };

      // on error fail
      const onFail = () => {
        // Token is invalid, return a 401 Unauthorized response
        res.status(401).send("Invalid token");
      };

      // authenticate
      authenticate(token, onSuccess, onFail);
    } else {
      // Authorization header is not present or has a wrong format, return a 401 Unauthorized response
      res.status(401).send("Authorization header required");
    }
  } else {
    next();
  }
};
