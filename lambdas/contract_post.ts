import { APIGatewayEvent } from "aws-lambda";
import { v4 } from "uuid";
import { dynamo, headers } from "../utils/lambda";

export const handler = async (event: APIGatewayEvent) => {
  const { link, reward, dueDate } = JSON.parse(event.body || "{}");
  const uuid = v4();
  return dynamo
    .putItem({
      Item: {
        uuid: {
          S: uuid,
        },
        link: {
          S: link,
        },
        reward: {
          N: `${reward}`,
        },
        dueDate: {
          S: dueDate,
        },
        lifecycle: {
          S: "active",
        },
      },
      TableName: "FlossContracts",
    })
    .promise()
    .then(() => ({
      statusCode: 200,
      body: JSON.stringify({
        link,
        reward,
        dueDate,
        uuid,
        lifecycle: "active",
      }),
      headers,
    }))
    .catch((e) => ({
      statusCode: 200,
      body: e.message,
      headers,
    }));
};
