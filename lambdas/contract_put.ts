import { APIGatewayEvent } from "aws-lambda";
import { activateContractById } from "../utils/lambda";

export const handler = async (event: APIGatewayEvent) => {
  const { id } = JSON.parse(event.body || "{}");
  return activateContractById(id)
};
