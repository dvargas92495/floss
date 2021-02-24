import { APIGatewayEvent } from "aws-lambda";
import { getStripeCustomer, headers, stripe } from "../utils/lambda";
import Stripe from "stripe";
import querystring from "querystring";

export const handler = async (event: APIGatewayEvent) => {
  const {
    priceId,
    quantity = 1,
    successParams,
    metadata,
  }: {
    priceId: string;
    successParams?: { [key: string]: string };
    metadata: Stripe.MetadataParam;
    quantity: number;
  } = JSON.parse(event.body || "{}");
  const reqHeaders = event.headers;
  const origin = reqHeaders.Origin || reqHeaders.origin;
  const customer = await getStripeCustomer(reqHeaders.Authorization);
  if (!customer) {
    return {
      statusCode: 401,
      body: "No Stripe Customer Found",
      headers,
    };
  }

  const paymentMethod = await stripe.customers
    .retrieve(customer)
    .then((c) => c as Stripe.Customer)
    .then((c) => c.invoice_settings?.default_payment_method);

  return paymentMethod
    ? stripe.subscriptions
        .create({
          customer,
          items: [{ price: priceId, quantity }],
        })
        .then((s) => ({
          statusCode: 200,
          body: JSON.stringify({ active: true, id: s.id }),
          headers,
        }))
        .catch((e) => ({
          statusCode: 500,
          body: `Failed to create subscription: ${e.errorMessage || e.message}`,
          headers,
        }))
    : stripe.checkout.sessions
        .create({
          customer,
          payment_method_types: ["card"],
          line_items: [
            {
              price: priceId,
              quantity,
            },
          ],
          mode: "subscription",
          success_url: `${origin}/user?${
            successParams
              ? querystring.stringify(successParams)
              : "success=true"
          }`,
          cancel_url: `${origin}/user?cancel=true`,
          metadata,
        })
        .then((session) => ({
          statusCode: 200,
          body: JSON.stringify({ id: session.id, active: false }),
          headers,
        }))
        .catch((e) => ({
          statusCode: 500,
          body: `Failed to create session ${e.errorMessage || e.message}`,
          headers,
        }));
};
