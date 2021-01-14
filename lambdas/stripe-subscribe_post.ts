import { APIGatewayEvent } from "aws-lambda";
import { getStripeCustomer, headers, stripe } from "../utils/lambda";
import Stripe from "stripe";

export const handler = async (event: APIGatewayEvent) => {
  const {
    priceId,
  }: {
    priceId: string;
  } = JSON.parse(event.body || "{}");
  const reqHeaders = event.headers;
  const origin = reqHeaders.Origin || reqHeaders.origin;
  const { customer } = await getStripeCustomer(reqHeaders.Authorization);
  const paymentMethod = stripe.customers
    .retrieve(customer)
    .then(
      (c) => (c as Stripe.Customer)?.invoice_settings?.default_payment_method
    );

  return paymentMethod
    ? stripe.subscriptions
        .create({
          customer,
          items: [{ price: priceId }],
        })
        .then(() => ({
          statusCode: 200,
          body: JSON.stringify({ active: true }),
          headers,
        }))
        .catch((e) => ({
          statusCode: 500,
          body: e.errorMessage || e.message,
          headers,
        }))
    : stripe.checkout.sessions
        .create({
          customer,
          payment_method_types: ["card"],
          line_items: [
            {
              price: priceId,
              quantity: 1,
            },
          ],
          mode: "subscription",
          success_url: `${origin}/user?success=true`,
          cancel_url: `${origin}/user?cancel=true`,
        })
        .then((session) => ({
          statusCode: 200,
          body: JSON.stringify({ id: session.id, active: false }),
          headers,
        }))
        .catch((e) => ({
          statusCode: 500,
          body: e.errorMessage || e.message,
          headers,
        }));
};
