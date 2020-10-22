import { APIGatewayEvent } from "aws-lambda";
import {
  getAxiosByGithubLink,
  getContractsByLink,
  headers,
  parsePriority,
  projectOpts,
} from "../utils/lambda";
import axios from "axios";

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
  const project = await getAxiosByGithubLink(link);
  const columns = await axios.get(project.columns_url, projectOpts);
  const cardsByColumn = await Promise.all(
    columns.data.map((c: { name: string; cards_url: string }) =>
      axios.get(c.cards_url, projectOpts).then((cards) => ({
        cards: cards.data.map((cd: { note: string; content_url: string; id: number }) => ({
          note: cd.note,
          link: cd.content_url ? cd.content_url.replace(
            "https://api.github.com/repos/",
            "https://github.com/"
          ) : `${link}#card-${cd.id}`,
        })),
        name: c.name,
      }))
    )
  );
  return {
    statusCode: 200,
    body: JSON.stringify({
      title: project.name,
      body: project.body,
      state: project.state,
      link: project.html_url,
      cards: cardsByColumn,
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
