import { APIGatewayEvent } from "aws-lambda";
import Stripe from "stripe";
import { getStripeCustomer, headers, stripe } from "../utils/lambda";

export const handler = async (event: APIGatewayEvent) => {
  const customer = await getStripeCustomer(event.headers.Authorization);
  if (!customer) {
    return {
      statusCode: 401,
      body: `No Stripe Customer Found with ${event.headers.Authorization}`,
      headers,
    }
  }
  
  const defaultPaymentMethod = await stripe.customers
    .retrieve(customer, { expand: ["invoice_settings.default_payment_method"] })
    .then(
      (c) =>
        (c as Stripe.Customer).invoice_settings
          .default_payment_method as Stripe.PaymentMethod
    );
  const paymentMethods = await stripe.paymentMethods
    .list({ customer, type: "card" })
    .then((r) =>
      r.data.map((pm) => ({
        id: pm.id,
        brand: pm.card?.brand,
        last4: pm.card?.last4,
      }))
    );
  return {
    statusCode: 200,
    body: JSON.stringify({
      paymentMethods,
      defaultPaymentMethod: defaultPaymentMethod && {
        id: defaultPaymentMethod.id,
        brand: defaultPaymentMethod.card?.brand,
        last4: defaultPaymentMethod.card?.last4,
      },
    }),
    headers,
  };
};
