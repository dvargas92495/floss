import { APIGatewayEvent } from "aws-lambda";
import { headers, stripe, getStripeCustomer } from "../utils/lambda";
import Stripe from "stripe";

export const handler = async (event: APIGatewayEvent) => {
  const customer = (await getStripeCustomer(event.headers.Authorization)) || "";
  return stripe.customers
    .retrieve(customer)
    .then((customer) => ({
      statusCode: 200,
      body: JSON.stringify({
        balance:
          parseInt((customer as Stripe.Customer).metadata.balance || "0") / 100,
      }),
      headers,
    }))
    .catch((e) => ({
      statusCode: 500,
      body: e.message,
      headers,
    }));
};
