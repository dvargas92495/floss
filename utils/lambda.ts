import AWS from "aws-sdk";
import Stripe from "stripe";

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
