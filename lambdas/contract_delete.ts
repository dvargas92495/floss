import { APIGatewayProxyHandler } from "aws-lambda";
import { dynamo, headers, verifyFlossClient } from "../utils/lambda";

export const handler: APIGatewayProxyHandler = async (event) => {
  if (!verifyFlossClient(event.headers.Authorization)) {
    return {
      statusCode: 401,
      body: "Unauthorized",
      headers,
    };
  }
  return dynamo
    .updateItem({
      TableName: "FlossContracts",
      Key: {
        uuid: { S: event.queryStringParameters?.uuid },
      },
      UpdateExpression: "SET #l = :l",
      ExpressionAttributeNames: {
        "#l": "lifecycle",
      },
      ExpressionAttributeValues: {
        ":l": { S: "closed" },
      },
    })
    .promise()
    .then(() => ({
      statusCode: 204,
      body: JSON.stringify({ success: true }),
      headers,
    }))
    .catch((e) => ({ statusCode: 500, body: e.message, headers }));
};
