import { APIGatewayEvent } from "aws-lambda";
import {
  dynamo,
  getAuth0UserFromEvent,
  getAxiosByGithubLink,
  headers,
  parsePriority,
} from "../utils/lambda";

export const handler = async (event: APIGatewayEvent) =>
  getAuth0UserFromEvent(event).then((user) =>
    dynamo
      .query({
        TableName: "FlossContracts",
        KeyConditionExpression: "createdBy = :c and lifecycle = :s",
        IndexName: "createdBy-lifecycle-index",
        ExpressionAttributeValues: {
          ":c": {
            S: user.email,
          },
          ":s": {
            S: "active",
          },
        },
      })
      .promise()
      .then((r) =>
        r.Count && r.Items
          ? Promise.all(
              r.Items.map((i) =>
                getAxiosByGithubLink(i.link.S).then((g) => ({
                  name: g.title,
                  label: g.labels
                    ? g.labels.map(({ name }) => name).join(",")
                    : "",
                  uuid: i.uuid.S,
                  link: i.link.S,
                  ...parsePriority(i),
                }))
              )
            )
          : Promise.resolve([])
      )
      .then((contracts) => ({
        statusCode: 200,
        body: JSON.stringify({
          contracts,
        }),
        headers,
      }))
      .catch((e) => ({
        statusCode: 500,
        body: e.message,
        headers,
      }))
  );
