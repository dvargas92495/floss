import { APIGatewayEvent } from "aws-lambda";
import Stripe from "stripe";
import { activateContract } from "../utils/lambda";

export const handler = async (event: APIGatewayEvent) => {
  const {
    data: {
      object: { customer, payment_method, id },
    },
  }: { data: { object: Stripe.SetupIntent } } = JSON.parse(event.body || "{}");
  return activateContract({
    id,
    customer,
    payment_method,
  });
};
