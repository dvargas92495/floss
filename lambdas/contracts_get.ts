import AWS from "aws-sdk";

AWS.config = new AWS.Config({ region: "us-east-1" });
const dynamo = new AWS.DynamoDB({ apiVersion: "2012-08-10" });
const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
};

export const handler = async () =>
  dynamo
    .query({
      TableName: "FlossContracts",
      KeyConditionExpression: "reward = :r and lifecycle = :s",
      IndexName: "reward-lifecycle-index",
      ExpressionAttributeValues: {
        ":r": {
          S: "100",
        },
        ":s": {
          S: "active",
        },
      },
    })
    .promise()
    .then((r) => ({
      statusCode: 200,
      body: JSON.stringify(r.Items),
      headers,
    }))
    .catch((e) => ({
      statusCode: 200,
      body: e.message,
      headers,
    }));
