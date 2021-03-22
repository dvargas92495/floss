import { APIGatewayEvent } from "aws-lambda";
import Stripe from "stripe";
import { headers, stripe } from "../utils/lambda";

export const handler = async (event: APIGatewayEvent) => {
  const {
    data: {
      object: { customer_email, lines },
    },
  }: { data: { object: Stripe.Invoice } } = JSON.parse(event.body || "{}");
  const callbacks = lines.data
    .filter((lineItem) => !!lineItem.price?.metadata?.callback)
    .map((lineItem) => {
      const callback = lineItem.price?.metadata?.callback as string;
      if (callback === "balance") {
        return stripe.customers
          .list({ email: customer_email || "" })
          .then((cs) => cs.data[0] as Stripe.Customer)
          .then((c) =>
            stripe.customers.update(c.id, {
              metadata: {
                balance:
                  parseInt(c.metadata.balance || "0") +
                  (lineItem.quantity || 0),
              },
            })
          )
          .then(() => Promise.resolve());
      }
      return Promise.resolve();
    });
  return Promise.all(callbacks).then(() => ({
    headers,
    statusCode: 200,
    body: JSON.stringify({ success: true }),
  }));
};
