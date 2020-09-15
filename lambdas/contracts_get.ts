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
          N: "100",
        },
        ":s": {
          S: "active",
        },
      },
    })
    .promise()
    .then((r) => ({
      statusCode: 200,
      body: JSON.stringify(r.Items?.map(i => ({
        uuid: i.uuid.S,
        reward: i.uuid.N,
        link: i.link.S,
        lifecycle: i.lifecycle.S,
        dueDate: i.dueDate.S,
      }))),
      headers,
    }))
    .catch((e) => ({
      statusCode: 200,
      body: e.message,
      headers,
    }));
