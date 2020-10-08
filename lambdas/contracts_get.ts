import { DynamoDB } from "aws-sdk";
import { getActiveContracts, headers, parsePriority } from "../utils/lambda";

const filterItem = (s: string) => (i: DynamoDB.AttributeMap) =>
  i.link.S && i.link.S.indexOf(s) > -1;

const mapItem = (i: DynamoDB.AttributeMap) => ({
  uuid: i.uuid.S,
  link: i.link.S,
  createdBy: i.createdBy.S,
  ...parsePriority(i),
});

export const handler = async () =>
  getActiveContracts()
    .then((r) => ({
      statusCode: 200,
      body: JSON.stringify({
        projects: r.Items?.filter(filterItem("/projects/")).map(mapItem) || [],
        issues: r.Items?.filter(filterItem("/issues/")).map(mapItem) || [],
      }),
      headers,
    }))
    .catch((e) => ({
      statusCode: 500,
      body: e.message,
      headers,
    }));
