import { APIGatewayEvent } from "aws-lambda";
import { v4 } from "uuid";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
};

export const handler = async (event: APIGatewayEvent) => {
  const { link, reward, dueDate } = JSON.parse(event.body || "{}");
  return {
    statusCode: 200,
    body: JSON.stringify({
      link,
      reward,
      dueDate,
      uuid: `CONTRACT-${v4()}`,
    }),
    headers,
  };
};
