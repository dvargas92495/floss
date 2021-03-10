import { APIGatewayEvent } from "aws-lambda";
import axios from "axios";
import { headers } from "../utils/lambda";
import { Stripe } from "stripe";

const MAPPING = {
  "checkout.session.completed": "stripe-payment-succeeded",
  "payment_method.attached": "stripe-payment-attached",
  "invoice.paid": "stripe-invoice-paid",
} as { [type: string]: string };

export const handler = async (event: APIGatewayEvent) => {
  const stripeEvent: Stripe.Event = JSON.parse(event.body || "{}");
  if (MAPPING[stripeEvent.type]) {
    return axios
      .post(
        `http://localhost:3001/dev/${MAPPING[stripeEvent.type]}`,
        stripeEvent
      )
      .then((r) => ({
        statusCode: r.status,
        body: JSON.stringify(r.data),
        headers: r.headers,
      }))
      .catch((e) => {
        const body = e.response?.data || e.message;
        console.error(body);
        return {
          statusCode: 500,
          body,
          headers,
        };
      });
  }
  console.log("Ignoring Stripe event", stripeEvent.type);
  return {
    statusCode: 204,
    body: JSON.stringify({ event: stripeEvent.type }),
    headers,
  };
};
