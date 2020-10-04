import { APIGatewayEvent } from "aws-lambda";
import { activateContractByStripeId } from "../utils/lambda";

export const handler = async (event: APIGatewayEvent) => {
  const { id } = JSON.parse(event.body || "{}");
  return activateContractByStripeId(id);
};
