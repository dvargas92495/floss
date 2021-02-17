import { APIGatewayEvent } from "aws-lambda";
import { activateContractByStripeId, headers } from "../utils/lambda";

export const handler = async (event: APIGatewayEvent) => {
  const {
    data: {
      object: { payment_intent, setup_intent }
    },
  } = JSON.parse(event.body || "{}");
  const contractStripeId = payment_intent || setup_intent;
  if (contractStripeId) {
    return activateContractByStripeId(contractStripeId);
  }
  return {
    statusCode: 204,
    body: JSON.stringify({}),
    headers,
  }
};
