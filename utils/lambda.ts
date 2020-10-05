import AWS from "aws-sdk";
import format from "date-fns/format";
import Stripe from "stripe";
import axios from "axios";

AWS.config = new AWS.Config({ region: "us-east-1" });
export const dynamo = new AWS.DynamoDB({ apiVersion: "2012-08-10" });
const ses = new AWS.SES({ apiVersion: "2010-12-01" });

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
export const DATE_FORMAT = "yyyy-MM-dd";
const DATE_FORMAT_LENGTH = DATE_FORMAT.toString().length;

export const parsePriority = (r?: AWS.DynamoDB.AttributeMap) => {
  if (!r?.priority?.S) {
    return {};
  }
  const priority = r.priority.S;
  const reward =
    MAX_REWARD - parseInt(priority.substring(0, MAX_REWARD_LENGTH));
  const dueDateStart = MAX_REWARD_LENGTH + 1;
  const dueDate = priority.substring(
    dueDateStart,
    dueDateStart + DATE_FORMAT_LENGTH
  );
  const createdDateStart = dueDateStart + DATE_FORMAT_LENGTH + 1;
  const createdDate = priority.substring(
    createdDateStart,
    createdDateStart + DATE_FORMAT_LENGTH
  );
  return { dueDate, reward, createdDate };
};

export const toPriority = ({
  dueDate,
  reward,
}: {
  dueDate: string;
  reward: number;
}) => {
  return `${(MAX_REWARD - reward)
    .toString()
    .padStart(4, "0")}-${dueDate}-${format(new Date(), DATE_FORMAT)}`;
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
    .promise();

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

export const activateContractByStripeId = (id: string) =>
  dynamo
    .query({
      TableName: "FlossContracts",
      KeyConditionExpression: "stripe = :s",
      IndexName: "stripe-index",
      ExpressionAttributeValues: {
        ":s": {
          S: id,
        },
      },
    })
    .promise()
    .then((r) =>
      r.Items?.length === 1
        ? dynamo
            .putItem({
              Item: {
                ...r.Items[0],
                lifecycle: {
                  S: "active",
                },
              },
              TableName: "FlossContracts",
              ReturnValues: "ALL_OLD",
            })
            .promise()
            .then((r) =>
              ses
                .sendEmail({
                  Destination: {
                    ToAddresses: ["dvargas92495@gmail.com"],
                  },
                  Message: {
                    Body: {
                      Text: {
                        Charset: "UTF-8",
                        Data: `Check out the contract at https://floss.davidvargas.me/contract?uuid=${r.Attributes?.uuid.S}`,
                      },
                    },
                    Subject: {
                      Charset: "UTF-8",
                      Data: `New Floss Contract from ${r.Attributes?.createdBy.S} is Active`,
                    },
                  },
                  Source: "no-reply@floss.davidvargas.me",
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
        : {
            statusCode: 500,
            body: `Failed to find one contract with stripe id ${id}`,
            headers,
          }
    )
    .catch((e) => ({
      statusCode: 500,
      body: e.message,
      headers,
    }));

export const getEmailFromHeaders = async (Authorization: string) => {
  const user = await axios.get("https://api.github.com/user", {
    headers: {
      Authorization,
    },
  });
  return user.data.email;
};
