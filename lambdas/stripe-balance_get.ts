import { APIGatewayEvent } from "aws-lambda";
import { headers, stripe, auth0UserClient, auth0Client } from "../utils/lambda";
import Stripe from "stripe";

export const handler = async (event: APIGatewayEvent) => {
  const eventHeaders = event.headers;
  return auth0UserClient
    .getProfile(eventHeaders.Authorization.substring("Bearer ".length))
    .then((user) => auth0Client.getUser({id: user.sub}))
    .then((user) => stripe.customers.retrieve(user?.app_metadata?.stripe))
    .then((customer) => ({
      statusCode: 200,
      body: JSON.stringify({
        balace: -(customer as Stripe.Customer).balance,
      }),
      headers,
    }))
    .catch((e) => ({
      statusCode: 500,
      body: e.message,
      headers,
    }));
};
