import { APIGatewayEvent } from "aws-lambda";
import { v4 } from "uuid";
import { dynamo, headers, parsePriority, toPriority } from "../utils/lambda";
import axios from "axios";

export const handler = async (event: APIGatewayEvent) => {
  const {
    link,
    createdBy,
    ...priorityProps
  }: {
    link: string;
    reward: number;
    dueDate: string;
    createdBy: string;
  } = JSON.parse(event.body || "{}");
  const uuid = v4();
  const priority = toPriority(priorityProps);
  return axios(link.replace("github.com", "api.github.com/repos")).then(
    (issue) =>
      issue.data.state === "open"
        ? dynamo
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
                  S: createdBy,
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
            }))
        : {
            statusCode: 400,
            body: `Issue ${link} is not open`,
            headers,
          }
  );
};
