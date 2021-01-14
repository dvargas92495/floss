import { APIGatewayEvent } from "aws-lambda";
import { headers, stripe } from "../utils/lambda";

export const handler = async (event: APIGatewayEvent) => {
  const project = event.queryStringParameters?.project;
  return stripe.products
    .list()
    .then((products) =>
      products.data.filter((p) => p.metadata["Project"] === project)
    )
    .then((products) => ({
      statusCode: 200,
      body: JSON.stringify({
        products,
      }),
      headers,
    }))
    .catch((e) => ({
      statusCode: 500,
      body: e.message,
      headers,
    }));
};
