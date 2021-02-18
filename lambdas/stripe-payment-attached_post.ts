import { APIGatewayEvent } from "aws-lambda";
import { Stripe } from "stripe";
import { headers, stripe } from "../utils/lambda";

export const handler = async (event: APIGatewayEvent) => {
  const {
    data: {
      object: { id, customer },
    },
  } = JSON.parse(event.body || "{}");
  const defaultPaymentMethod = await stripe.customers
    .retrieve(customer)
    .then((c) => c as Stripe.Customer)
    .then((c) => c.invoice_settings.default_payment_method as string);
  if (defaultPaymentMethod) {
    return {
      statusCode: 204,
      body: JSON.stringify({}),
      headers,
    };
  } else {
    return stripe.customers
      .update(customer, { invoice_settings: { default_payment_method: id } })
      .then(() => ({
        statusCode: 200,
        body: JSON.stringify({ success: true }),
        headers,
      }));
  }
};
