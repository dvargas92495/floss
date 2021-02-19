import { APIGatewayEvent } from "aws-lambda";
import axios from "axios";
import { headers } from "../utils/lambda";
import { Stripe } from "stripe";

const MAPPING = {
  "checkout.session.completed": "stripe-payment-succeeded",
  "payment_method.attached": "stripe-payment-attached",
  "setup_intent.succeeded": "stripe-setup-succeeded",
} as {[type: string]: string};

export const handler = async (event: APIGatewayEvent) => {
  const stripeEvent: Stripe.Event = JSON.parse(
    event.body || "{}"
  );
  if (MAPPING[stripeEvent.type]) {
    return axios
      .post(`http://localhost:3001/dev/${MAPPING[stripeEvent.type]}`, stripeEvent)
      .then((r) => ({
        statusCode: r.status,
        body: JSON.stringify(r.data),
        headers: r.headers,
      }));
  }
  return {
    statusCode: 204,
    body: JSON.stringify({}),
    headers,
  };
};
