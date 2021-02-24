import { APIGatewayEvent } from "aws-lambda";
import axios from "axios";
import Stripe from "stripe";
import { headers } from "../utils/lambda";

export const handler = async (event: APIGatewayEvent) => {
  const {
    data: {
      object: { customer_email, lines },
    },
  }: { data: { object: Stripe.Invoice } } = JSON.parse(event.body || "{}");
  const callbacks = lines.data
    .filter((lineItem) => !!lineItem.price?.metadata?.callback)
    .map((lineItem) =>
      axios.post(lineItem.price?.metadata?.callback as string, {
        email: customer_email,
        quantity: lineItem.quantity,
        token: lineItem.price?.metadata?.token as string,
      })
    );
  return Promise.all(callbacks).then(() => ({
    headers,
    statusCode: 200,
    body: JSON.stringify({ success: true }),
  }));
};
