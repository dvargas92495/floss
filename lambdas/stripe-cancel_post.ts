import { APIGatewayEvent } from "aws-lambda";
import { getStripeCustomer, headers, stripe } from "../utils/lambda";

export const handler = async (event: APIGatewayEvent) => {
  const {
    subscriptionId,
  }: {
    subscriptionId: string;
  } = JSON.parse(event.body || "{}");
  const customer = await getStripeCustomer(event.headers.Authorization);
  const subscriptions = await stripe.subscriptions.list({ customer });
  if (!subscriptions.data.some(({ id }) => id === subscriptionId)) {
    return {
      statusCode: 401,
      body: "Customer attempted to cancel a subscription that wasn't theirs.",
      headers,
    };
  }

  return stripe.subscriptions
    .del(subscriptionId)
    .then(() => ({
      statusCode: 200,
      body: JSON.stringify({ success: true }),
      headers,
    }))
    .catch((e) => ({
      statusCode: 500,
      body: e.errorMessage || e.message,
      headers,
    }));
};
