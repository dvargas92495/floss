import { APIGatewayEvent } from "aws-lambda";
import { dynamo, headers, parsePriority } from "../utils/lambda";

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
        link: r.Item?.link.S,
        lifecycle: r.Item?.lifecycle.S,
        ...parsePriority(r.Item),
      }),
      headers,
    }))
    .catch((e) => ({
      statusCode: 200,
      body: e.message,
      headers,
    }));
