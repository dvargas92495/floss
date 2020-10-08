import { APIGatewayEvent } from "aws-lambda";
import { headers } from "../utils/lambda";

export const handler = async (event: APIGatewayEvent) => {
  if (!event.queryStringParameters?.link) {
    return {
      statusCode: 404,
      body: "No link provided",
      headers,
    };
  }
};
