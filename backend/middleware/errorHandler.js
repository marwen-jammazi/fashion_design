export const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Not found: ${req.originalUrl}`));
};

export const errorHandler = (err, req, res, next) => {
  let status = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message;

  if (err.name === "CastError") {
    status = 400;
    message = "Invalid ID";
  }
  if (err.code === 11000) {
    status = 400;
    message = "A record with that value already exists";
  }
  if (err.name === "ValidationError") {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(", ");
  }
  if (err.name === "MulterError") {
  status = 400;
  message =
    err.code === "LIMIT_FILE_SIZE"
      ? "Image is too large (max 8 MB)"
      : err.message;
}

  res.status(status).json({
    message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
};