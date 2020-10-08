import { APIGatewayEvent } from "aws-lambda";
import {
  getAxiosByGithubLink,
  getContractsByLink,
  headers,
  parsePriority,
} from "../utils/lambda";

export const handler = async (event: APIGatewayEvent) => {
  if (!event.queryStringParameters?.link) {
    return {
      statusCode: 404,
      body: "No link provided",
      headers,
    };
  }
  const link = `https://github.com/${event.queryStringParameters.link}`;
  const contracts = await getContractsByLink(link);
  const issue = await getAxiosByGithubLink(link);
  return {
    statusCode: 200,
    body: JSON.stringify({
      title: issue.title,
      body: issue.body,
      state: issue.state,
      link: issue.html_url,
      contracts: contracts.Items?.map((i) => ({
        uuid: i.uuid?.S,
        lifecycle: i.lifecycle?.S,
        createdBy: i.createdBy?.S,
        ...parsePriority(i),
      })),
    }),
    headers,
  };
};
