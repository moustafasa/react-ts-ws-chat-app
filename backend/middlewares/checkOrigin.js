const allowedHosts = [
  "http://localhost:3001",
  "http://localhost:5173",
  "http://localhost:3002",
];
// Create a middleware function that checks the request origin
export const checkOrigin = (req, res, next) => {
  // Get the origin from the request headers
  const origin = req.headers.origin;
  // If the origin is in the allowed hosts, proceed to the next middleware
  if (allowedHosts.includes(origin)) {
    next();
  } else {
    // Otherwise, send a 403 forbidden response
    res.status(403).send("Access denied");
  }
};
