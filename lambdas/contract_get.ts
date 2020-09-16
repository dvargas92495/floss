import { APIGatewayEvent } from "aws-lambda";
import { dynamo, headers } from "../utils/lambda";

export const handler = async (event: APIGatewayEvent) =>
  dynamo
    .getItem({
      TableName: "FlossContracts",
      Key: {
        uuid: {
          S: event.queryStringParameters?.uuid,
        },
      },
    })
    .promise()
    .then((r) => ({
      statusCode: 200,
      body: JSON.stringify({
        reward: r.Item?.reward.N,
        link: r.Item?.link.S,
        dueDate: r.Item?.dueDate.S,
        lifecycle: r.Item?.lifecycle.S,
      }),
      headers,
    }))
    .catch((e) => ({
      statusCode: 200,
      body: e.message,
      headers,
    }));
