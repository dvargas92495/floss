import AWS from "aws-sdk";
import Stripe from "stripe";
import { v4 } from "uuid";

AWS.config = new AWS.Config({ region: "us-east-1" });
export const dynamo = new AWS.DynamoDB({ apiVersion: "2012-08-10" });

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2020-08-27",
});

export const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
};

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
    .then(
      (r) =>
        r.Items?.map((i) => ({
          uuid: i.uuid.S,
          reward: i.reward.N,
          link: i.link.S,
          dueDate: i.dueDate.S,
        })) || []
    );

export const getFlossUserByEmail = (email: string) =>
  dynamo
    .query({
      TableName: "FlossUsers",
      KeyConditionExpression: "email = :e",
      IndexName: "email-index",
      ExpressionAttributeValues: {
        ":e": {
          S: email,
        },
      },
    })
    .promise();

export const activateContractById = (id: string) => {
  const uuid = v4();
  return dynamo
    .getItem({
      TableName: "FlossContracts",
      Key: {
        uuid: {
          S: id,
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
}