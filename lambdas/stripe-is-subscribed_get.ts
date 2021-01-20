import { APIGatewayEvent } from "aws-lambda";
import { getStripeCustomer, headers, stripe } from "../utils/lambda";

export const handler = async (event: APIGatewayEvent) => {
  const product = event.queryStringParameters?.product;
  if (!product) {
    return {
      statusCode: 400,
      body: "Product query param is required",
      headers,
    };
  }
  const { customer } = await getStripeCustomer(event.headers.Authorization);
  const subscriptions = await stripe.subscriptions.list({ customer });
  const products = await Promise.all(
    subscriptions.data
      .flatMap((s) =>
        s.items.data.map((i) => ({
          productId: i.price.product as string,
          id: i.id,
        }))
      )
      .map(({ productId, id }) =>
        stripe.products.retrieve(productId).then((p) => ({ name: p.name, id }))
      )
  );

  return {
    statusCode: 200,
    body: JSON.stringify({
      subscriptionId: products.find((p) => p.name === product)?.id,
    }),
    headers,
  };
};
