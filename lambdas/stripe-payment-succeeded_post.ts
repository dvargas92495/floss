import { APIGatewayEvent } from "aws-lambda";
import { dynamo, headers } from "../utils/lambda";

export const handler = async (event: APIGatewayEvent) => {
  const {
    data: {
      object: { payment_intent },
    },
  } = JSON.parse(event.body || "{}");
  return dynamo
    .query({
      TableName: "FlossContracts",
      KeyConditionExpression: "stripe = :s",
      IndexName: "stripe-index",
      ExpressionAttributeValues: {
        ":s": {
          S: payment_intent,
        },
      },
    })
    .promise()
    .then((r) => r.Items?.length === 1 ?
      dynamo
        .putItem({
          Item: {
            ...r.Items[0],
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
        success: true,
      }),
      headers,
    }))
    : {
      statusCode: 500,
      body: `Failed to find one contract with stripe id ${payment_intent}`,
      headers,
    })
    .catch((e) => ({
      statusCode: 500,
      body: e.message,
      headers,
    }));
};
