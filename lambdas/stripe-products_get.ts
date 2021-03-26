import { APIGatewayEvent } from "aws-lambda";
import { headers, stripe } from "../utils/lambda";

export const handler = async (event: APIGatewayEvent) => {
  const project = event.queryStringParameters?.project;
  return stripe.products
    .list()
    .then((products) =>
      Promise.all(
        products.data
          .filter((p) => p.metadata["Project"] === project)
          .map(({ id, name, description, images: [image] }) =>
            stripe.prices.list({ product: id }).then((r) => ({
              id,
              name,
              description,
              image,
              prices: r.data.map((p) => ({
                id: p.id,
                price: p.unit_amount,
                isMonthly: p.type === "recurring",
              })),
            }))
          )
      )
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
