import { APIGatewayEvent } from "aws-lambda";
import { v4 } from "uuid";
import {
  dynamo,
  headers,
  parsePriority,
  toPriority,
  validateGithubLink,
} from "../utils/lambda";

export const handler = async (event: APIGatewayEvent) => {
  const {
    link,
    ...priorityProps
  }: {
    link: string;
    reward: number;
    dueDate: string;
  } = JSON.parse(event.body || "{}");
  const response = await validateGithubLink(link);
  if (response.body) {
    return response;
  }

  const uuid = v4();
  const priority = toPriority(priorityProps);
  return dynamo
    .putItem({
      Item: {
        uuid: {
          S: uuid,
        },
        link: {
          S: link,
        },
        priority: {
          S: priority,
        },
        lifecycle: {
          S: "active",
        },
        createdBy: {
          S: "dvargas924595@gmail.com",
        },
      },
      TableName: "FlossContracts",
    })
    .promise()
    .then((r) => ({
      statusCode: 200,
      body: JSON.stringify({
        link,
        uuid,
        lifecycle: "active",
        ...parsePriority(r.Attributes),
      }),
      headers,
    }))
    .catch((e) => ({
      statusCode: 500,
      body: e.message,
      headers,
    }));
};
