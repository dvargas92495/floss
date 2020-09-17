import { APIGatewayEvent } from "aws-lambda";
import { v4 } from "uuid";
import { dynamo, headers } from "../utils/lambda";
import axios from "axios";

export const handler = async (event: APIGatewayEvent) => {
  const { link, reward, dueDate } = JSON.parse(event.body || "{}");
  const uuid = v4();
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
                reward: {
                  N: `${reward}`,
                },
                dueDate: {
                  S: dueDate,
                },
                lifecycle: {
                  S: "active",
                },
              },
              TableName: "FlossContracts",
            })
            .promise()
            .then(() => ({
              statusCode: 200,
              body: JSON.stringify({
                link,
                reward,
                dueDate,
                uuid,
                lifecycle: "active",
              }),
              headers,
            }))
            .catch((e) => ({
              statusCode: 500,
              body: e.message,
              headers,
            }))
        : {
            statusCode: 500,
            body: `Issue ${link} is not open`,
            headers,
          }
  );
};
