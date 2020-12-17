import { APIGatewayEvent } from "aws-lambda";
import { DynamoDB } from "aws-sdk";
import {
  dynamo,
  getAuth0UserFromEvent,
  headers,
  parsePriority,
} from "../utils/lambda";

const mapItem = (i: DynamoDB.AttributeMap) => ({
  uuid: i.uuid.S,
  link: i.link.S,
  createdBy: i.createdBy.S,
  ...parsePriority(i),
});

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
      .then((r) => ({
        statusCode: 200,
        body: JSON.stringify({
          contracts: r.Items?.map(mapItem),
        }),
        headers,
      }))
      .catch((e) => ({
        statusCode: 500,
        body: e.message,
        headers,
      }))
  );
