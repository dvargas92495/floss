import { APIGatewayEvent } from "aws-lambda";
import {
  dynamo,
  getFlossUserByEmail,
  headers,
  stripe,
  toPriority,
} from "../utils/lambda";
import axios from "axios";
import { v4 } from "uuid";

export const handler = async (event: APIGatewayEvent) => {
  const {
    link,
    reward,
    dueDate,
    createdBy,
  }: {
    link: string;
    reward: number;
    dueDate: string;
    createdBy: string;
  } = JSON.parse(event.body || "{}");
  const reqHeaders = event.headers;
  const issue = await axios.get(
    link.replace("github.com", "api.github.com/repos")
  );
  if (issue.data.state !== "open") {
    return {
      statusCode: 400,
      body: `Issue ${link} is not open`,
      headers,
    };
  }

  const user = await axios.get("https://api.github.com/user", {
    headers: {
      Authorization: reqHeaders.Authorization,
    },
  });
  const flossUser = await getFlossUserByEmail(user.data.email);
  if (flossUser.Count === 0 || !flossUser.Items) {
    return {
      statusCode: 500,
      body: `Could not find Floss user for ${user.data.email}`,
      headers,
    };
  }

  const intent = await stripe.setupIntents.create({
    customer: flossUser.Items[0].client.S,
  });

  const uuid = v4();
  return dynamo
    .putItem({
      Item: {
        uuid: {
          S: uuid,
        },
        stripe: {
          S: intent.id,
        },
        link: {
          S: link,
        },
        lifecycle: {
          S: "pending",
        },
        priority: {
          S: toPriority({ reward, dueDate }),
        },
        createdBy: {
          S: createdBy,
        },
      },
      TableName: "FlossContracts",
    })
    .promise()
    .then(() => ({
      statusCode: 200,
      body: JSON.stringify({
        client_secret: intent.client_secret,
        id: intent.id,
      }),
      headers,
    }));
};
