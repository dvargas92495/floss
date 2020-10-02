import { APIGatewayEvent } from "aws-lambda";
import { activateContractByStripeId } from "../utils/lambda";

export const handler = async (event: APIGatewayEvent) => {
  const {
    data: {
      object: { payment_intent },
    },
  } = JSON.parse(event.body || "{}");
  return activateContractByStripeId(payment_intent);
};
