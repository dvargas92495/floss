import { APIGatewayEvent } from "aws-lambda";
import {
  dynamo,
  getAxiosByGithubLink,
  getEmailFromHeaders,
  headers,
  parsePriority,
} from "../utils/lambda";

export const handler = async (event: APIGatewayEvent) =>
  getEmailFromHeaders(event.headers.Authorization)
    .then((email) =>
      dynamo
        .query({
          TableName: "FlossContracts",
          KeyConditionExpression: "createdBy = :c and lifecycle = :s",
          IndexName: "createdBy-lifecycle-index",
          ExpressionAttributeValues: {
            ":c": {
              S: email,
            },
            ":s": {
              S: "active",
            },
          },
        })
        .promise()
    )
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
    .catch((e) => {
      console.log(e);
      return {
        statusCode: 500,
        body: e.response?.data?.message || e.message,
        headers,
      };
    });
