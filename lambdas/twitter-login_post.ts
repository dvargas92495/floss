import { APIGatewayEvent } from "aws-lambda";
import { headers } from "../utils/lambda";

export const handler = async (event: APIGatewayEvent) => {
  console.log(event.body);
  return {
    statusCode: 200,
    body: JSON.stringify({ registered: true }),
    headers,
  };
};
