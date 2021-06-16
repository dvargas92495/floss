import { APIGatewayEvent } from "aws-lambda";
import { dynamo, headers, stripe, verifyFlossClient } from "../utils/lambda";

export const handler = async (event: APIGatewayEvent) => {
  if (!verifyFlossClient(event.headers.Authorization)) {
    return {
      statusCode: 401,
      body: "Unauthorized",
      headers,
    };
  }
  const { uuid, customer } = event.queryStringParameters || {};
  if (!uuid || !customer) {
    return {
      statusCode: 400,
      body: "both uuid and customer are required",
      headers,
    };
  }

  return dynamo
    .getItem({ TableName: "FlossProjects", Key: { uuid: { S: uuid } } })
    .promise()
    .then((d) =>
      stripe.paymentIntents
        .list({ customer })
        .then((pis) => {
          const amount = Number(d.Item?.funding.N) * 100;
          const payment_intent =
            pis.data.find((pi) => pi.metadata.project === uuid)?.id ||
            pis.data.find((pi) => pi.amount === amount)?.id;
          return stripe.refunds.create({
            amount,
            reason: "requested_by_customer",
            payment_intent,
          });
        })
        .then(() =>
          dynamo.updateItem({
            TableName: "FlossProjects",
            Key: {
              uuid: { S: uuid },
            },
            UpdateExpression: "SET #t = :t",
            ExpressionAttributeNames: {
              "#t": "tenant",
            },
            ExpressionAttributeValues: {
              ":t": { S: `${d.Item?.tenant}_closed` },
            },
          }).promise()
        )
    )
    .catch((e) => ({
      statusCode: 500,
      body: e.errorMessage || e.message,
      headers,
    }));
};
