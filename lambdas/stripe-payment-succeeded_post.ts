import { APIGatewayEvent } from "aws-lambda";
import { activateContractById } from "../utils/lambda";

export const handler = async (event: APIGatewayEvent) => {
  const { data: { object: { payment_intent } } } = JSON.parse(event.body || "{}");
  return activateContractById(payment_intent);
};
