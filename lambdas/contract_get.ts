import { APIGatewayEvent } from "aws-lambda";
import {
  dynamo,
  getAxiosByGithubLink,
  headers,
  parsePriority,
} from "../utils/lambda";

export const handler = async (event: APIGatewayEvent) =>
  dynamo
    .getItem({
      TableName: "FlossContracts",
      Key: {
        uuid: {
          S: event.queryStringParameters?.uuid,
        },
      },
    })
    .promise()
    .then((r) =>
      getAxiosByGithubLink(r.Item?.link.S).then((g) => ({
        statusCode: 200,
        body: JSON.stringify({
          contract: {
            link: r.Item?.link.S,
            lifecycle: r.Item?.lifecycle.S,
            createdBy: r.Item?.createdBy.S,
            ...parsePriority(r.Item),
          },
          title: g.title || g.name,
        }),
        headers,
      }))
    )
    .catch((e) => ({
      statusCode: 500,
      body: e.message,
      headers,
    }));
