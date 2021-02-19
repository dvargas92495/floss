import { headers } from "../utils/lambda";

export const handler = async () => {
  return {
    statusCode: 500,
    body: 'This method is deprecated',
    headers,
  };
};
