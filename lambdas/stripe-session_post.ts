import { APIGatewayEvent } from "aws-lambda";
import { headers, stripe } from "../utils/lambda";

export const handler = async (event: APIGatewayEvent) => {
  const {
    value,
    isMonthly,
    name,
    cancelPath = "checkout?cancel=true",
    successPath = "checkout?success=true",
  }: {
    name: string;
    value: number;
    isMonthly: boolean;
    cancelPath: string;
    successPath: string;
  } = JSON.parse(event.body || "{}");

  const reqHeaders = event.headers;
  const origin = reqHeaders.Origin || reqHeaders.origin;
  const product = await stripe.products
    .list()
    .then((ps) => ps.data.find((p) => p.name === name)?.id);
  if (!product) {
    return {
      statusCode: 400,
      body: `No product found with name ${name}`,
      headers,
    };
  }

  const price = await stripe.prices
    .list({ product })
    .then((r) =>
      r.data.find(
        (p) =>
          (p.type === "recurring" && isMonthly) ||
          (p.type === "one_time" && !isMonthly)
      )
    );
  if (!price) {
    return {
      statusCode: 400,
      body: `No price found with product ${name} and isMonthly ${isMonthly}`,
      headers,
    };
  }

  const multiple = price.transform_quantity?.divide_by || 1;
  return stripe.checkout.sessions
    .create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: price.id,
          quantity: value * multiple,
        },
      ],
      metadata: {
        skipCallback: "true",
      },
      mode: isMonthly ? "subscription" : "payment",
      success_url: `${origin}/${successPath}`,
      cancel_url: `${origin}/${cancelPath}`,
    })
    .then((session) => ({
      statusCode: 200,
      body: JSON.stringify({ id: session.id, active: false }),
      headers,
    }))
    .catch((e) => ({
      statusCode: 500,
      body: e.errorMessage || e.message,
      headers,
    }));
};
