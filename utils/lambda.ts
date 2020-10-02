import AWS from "aws-sdk";
import format from "date-fns/format";
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

/**
 * sort order is
 * - Reward
 * - Due Date
 * - Created Date
 *
 * Because our sort order is ascending, we need to set reward to
 *    `MAX - reward`
 * so that highest rewards are prioritized
 */
export const MAX_REWARD = 9999;
const MAX_REWARD_LENGTH = MAX_REWARD.toString().length;
const DATE_FORMAT = "yyyy-MM-dd";
const DATE_FORMAT_LENGTH = DATE_FORMAT.toString().length;

export const parsePriority = (r?: AWS.DynamoDB.AttributeMap) => {
  if (!r?.priority?.S) {
    return {};
  }
  const priority = r.priority.S;
  const reward = MAX_REWARD - parseInt(priority.substring(0, MAX_REWARD_LENGTH));
  const dueDateStart = MAX_REWARD_LENGTH + 1;
  const dueDate = priority.substring(dueDateStart, dueDateStart + DATE_FORMAT_LENGTH);
  const createdDateStart = dueDateStart + DATE_FORMAT_LENGTH + 1;
  const createdDate = priority.substring(createdDateStart, createdDateStart + DATE_FORMAT_LENGTH);
  return { dueDate, reward, createdDate };
};

export const toPriority = ({
  dueDate,
  reward,
}: {
  dueDate: string;
  reward: number;
}) => {
  return `${(MAX_REWARD - reward).toString().padStart(4, "0")}-${dueDate}-${format(
    new Date(),
    DATE_FORMAT
  )}`;
};

export const getActiveContracts = () =>
  dynamo
    .query({
      TableName: "FlossContracts",
      KeyConditionExpression: "priority >= :p and lifecycle = :s",
      IndexName: "lifecycle-priority-index",
      ExpressionAttributeValues: {
        ":p": {
          S: "0000-2020-10-02-2020-10-02",
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
          link: i.link.S,
          ...parsePriority(i),
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
};
