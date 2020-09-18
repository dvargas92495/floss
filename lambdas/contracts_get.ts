import { getActiveContracts, headers } from "../utils/lambda";

export const handler = async () =>
  getActiveContracts()
    .then((r) => ({
      statusCode: 200,
      body: JSON.stringify(r),
      headers,
    }))
    .catch((e) => ({
      statusCode: 200,
      body: e.message,
      headers,
    }));
