class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something went wrong",
    errors = [],
    data = null
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.data = data;
    this.success = false;

    // Capture the stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}
