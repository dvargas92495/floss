import { APIGatewayEvent } from "aws-lambda";
import { v4 } from "uuid";
import { dynamo, headers } from "../utils/lambda";

export const handler = async (event: APIGatewayEvent) => {
  const { payment_intent } = JSON.parse(event.body || "{}");
  const uuid = v4();
  return dynamo
    .getItem({
      TableName: "FlossContracts",
      Key: {
        uuid: {
          S: payment_intent,
        },
      },
    })
    .promise()
    .then((r) =>
      dynamo
        .putItem({
          Item: {
            ...r.Item,
            uuid: {
              S: uuid,
            },
            lifecycle: {
              S: "active",
            },
          },
          TableName: "FlossContracts",
        })
        .promise()
    )
    .then(() => ({
      statusCode: 200,
      body: JSON.stringify({
        success: true,
      }),
      headers,
    }))
    .catch((e) => ({
      statusCode: 500,
      body: e.message,
      headers,
    }));
};
