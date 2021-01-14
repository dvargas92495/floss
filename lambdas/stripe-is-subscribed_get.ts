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
      .flatMap((s) => s.items.data.map((i) => i.price.product as string))
      .map((productId) => stripe.products.retrieve(productId))
  );

  return {
    statusCode: 200,
    body: JSON.stringify({
      subscribed: products.some((p) => p.name === product),
    }),
    headers,
  };
};
