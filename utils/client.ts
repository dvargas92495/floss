export const API_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3001/dev"
    : `https://${process.env.NEXT_PUBLIC_REST_API_ID}.execute-api.us-east-1.amazonaws.com/production`;
