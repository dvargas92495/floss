import { APIGatewayEvent } from "aws-lambda";
import { headers, stripe, getStripeCustomer } from "../utils/lambda";

export const handler = async (event: APIGatewayEvent) => {
  const customer = await getStripeCustomer(event.headers.Authorization);
  return stripe.subscriptions
    .list({
      customer,
    })
    .then((r) => {
      const ids = r.data.flatMap((s) =>
        s.items.data.map((i) => i.price.product as string)
      );
      return stripe.products.list({ ids }).then((products) => {
        const productMap = Object.fromEntries(
          products.data.map(({ id, name, description }) => [
            id,
            { name, description },
          ])
        );
        return r.data.flatMap((s) =>
          s.items.data.map((i) => ({
            ...productMap[i.price.product as string],
            id: s.id,
            amount: i.price.transform_quantity
              ? ((i.quantity || 1) * (i.price.unit_amount || 1)) /
                100 /
                i.price.transform_quantity.divide_by
              : (i.price.unit_amount || 1) / 100,
            interval: "mo",
          }))
        );
      });
    })
    .then((subscriptions) => ({
      statusCode: 200,
      body: JSON.stringify({
        subscriptions,
      }),
      headers,
    }))
    .catch((e) => ({
      statusCode: 500,
      body: e.message,
      headers,
    }));
};
