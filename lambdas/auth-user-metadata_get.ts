import { APIGatewayEvent } from "aws-lambda";
import { headers, auth0UserClient, auth0Client } from "../utils/lambda";

export const handler = async (event: APIGatewayEvent) => {
  const eventHeaders = event.headers;
  const query = event.queryStringParameters?.key;
  return auth0UserClient
    .getProfile(eventHeaders.Authorization.substring("Bearer ".length))
    .then((user) => auth0Client.getUser({ id: user.sub }))
    .then((user) => ({
      statusCode: 200,
      body: user.user_metadata
        ? JSON.stringify(
            query ? { [query]: user.user_metadata[query] } : user.user_metadata
          )
        : JSON.stringify({}),
      headers,
    }))
    .catch((e) => ({
      statusCode: 500,
      body: e.message,
      headers,
    }));
};
