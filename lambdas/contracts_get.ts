import { dynamo, headers } from "../utils/lambda";

export const getActiveContracts = () =>
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
    .then((r) =>
      r.Items?.map((i) => ({
        uuid: i.uuid.S,
        reward: i.reward.N,
        link: i.link.S,
        dueDate: i.dueDate.S,
      })) || []
    );

export const handler = async () =>
  getActiveContracts()
    .then((r) => ({
      statusCode: 200,
      body: JSON.stringify(r),
      headers,
    }))
    .catch((e) => ({
      statusCode: 200,
      body: e.message,
      headers,
    }));
