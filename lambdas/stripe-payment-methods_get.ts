import { APIGatewayEvent } from "aws-lambda";
import Stripe from "stripe";
import {
  getStripeCustomer,
  headers,
  stripe,
} from "../utils/lambda";

export const handler = async (event: APIGatewayEvent) => {
  const { customer } = await getStripeCustomer(event.headers.Authorization);
  const paymentMethods = await stripe.paymentMethods
    .list({
      customer,
      type: "card",
    })
    .catch(() => Promise.resolve({
      data: [] as Stripe.PaymentMethod[],
    }));

  return {
    statusCode: 200,
    body: JSON.stringify(
      paymentMethods.data.map((pm) => ({
        id: pm.id,
        brand: pm.card?.brand,
        last4: pm.card?.last4,
      }))
    ),
    headers,
  };
};
