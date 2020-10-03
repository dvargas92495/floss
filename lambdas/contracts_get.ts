import { getActiveContracts, headers, parsePriority } from "../utils/lambda";

export const handler = async () =>
  getActiveContracts()
    .then((r) => ({
      statusCode: 200,
      body: JSON.stringify(
        r.Items?.map((i) => ({
          uuid: i.uuid.S,
          link: i.link.S,
          createdBy: i.createdBy.S,
          ...parsePriority(i),
        })) || []
      ),
      headers,
    }))
    .catch((e) => ({
      statusCode: 500,
      body: e.message,
      headers,
    }));
