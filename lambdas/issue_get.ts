import { APIGatewayEvent } from "aws-lambda";
import {
  getAxiosByGithubLink,
  getContractsByLink,
  headers,
  parsePriority,
  stripe,
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
  const contracts = await getContractsByLink(link).then((c) =>
    Promise.all(
      (c.Items || []).map((i) =>
        stripe.customers
          .list({ email: i.createdBy.S })
          .then((cus) => ({ i, name: cus.data[0]?.name || i.createdBy.S }))
      )
    )
  );
  const issue = await getAxiosByGithubLink(link);
  return {
    statusCode: 200,
    body: JSON.stringify({
      title: issue.title,
      body: issue.body,
      state: issue.state,
      link: issue.html_url,
      contracts: contracts.map(({ i, name }) => ({
        uuid: i.uuid?.S,
        lifecycle: i.lifecycle?.S,
        createdBy: i.createdBy?.S,
        createdByName: name,
        ...parsePriority(i),
      })),
    }),
    headers,
  };
};
