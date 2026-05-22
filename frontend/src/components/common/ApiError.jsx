function ApiError({ message }) {
  if (!message) return null;
  return (
    <p className="api-error-message" role="alert">
      {message}
    </p>
  );
}

export default ApiError;
