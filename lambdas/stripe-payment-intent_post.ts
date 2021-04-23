import { APIGatewayEvent } from "aws-lambda";
import { getStripeCustomer, headers, stripe } from "../utils/lambda";
import { Stripe } from "stripe";

export const handler = async (event: APIGatewayEvent) => {
  const {
    name,
    value,
    metadata,
    successPath = "checkout?success=true",
    cancelPath = "checkout?cancel=true",
  }: {
    name: string;
    value: number;
    metadata: Stripe.Metadata;
    successPath?: string;
    cancelPath?: string;
  } = JSON.parse(event.body || "{}");

  const reqHeaders = event.headers;
  const origin = reqHeaders.Origin || reqHeaders.origin;
  const customer = await getStripeCustomer(reqHeaders.Authorization);
  const payment_method =
    customer &&
    (await stripe.customers
      .retrieve(customer)
      .then((c) => c as Stripe.Customer)
      .then((c) =>
        c.invoice_settings.default_payment_method
          ? (c.invoice_settings.default_payment_method as string)
          : undefined
      ));

  return payment_method && customer
    ? stripe.paymentIntents
        .create({
          customer,
          amount: value,
          payment_method,
          currency: "usd",
          metadata,
        })
        .then((p) => stripe.paymentIntents.confirm(p.id))
        .then(() => ({
          statusCode: 200,
          body: JSON.stringify({
            active: true,
          }),
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
          payment_intent_data: {
            setup_future_usage: "off_session",
          },
          mode: "payment",
          line_items: [
            {
              price_data: {
                currency: "usd",
                unit_amount: value,
                product_data: {
                  name,
                }
              },
              quantity: 1,
            },
          ],
          metadata,
          success_url: `${origin}/${successPath}`,
          cancel_url: `${origin}/${cancelPath}`,
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
