import { APIGatewayEvent } from "aws-lambda";
import { headers, stripe, getStripeCustomer } from "../utils/lambda";

export const handler = async (event: APIGatewayEvent) => {
  const customer = await getStripeCustomer(event.headers.Authorization);
  return stripe.subscriptions
    .list({ customer })
    .then((subs) => ({
      statusCode: 200,
      body: JSON.stringify({
        subscriptions: subs.data.map((s) => ({
          price: s.items.data[0].price.id,
          id: s.id,
          status: s.status,
        })),
      }),
      headers,
    }))
    .catch((e) => ({
      statusCode: 500,
      body: e.message,
      headers,
    }));
};
