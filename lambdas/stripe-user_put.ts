import { APIGatewayEvent } from "aws-lambda";
import { headers, stripe } from "../utils/lambda";

export const handler = async (event: APIGatewayEvent) => {
  const { name, email } = JSON.parse(event.body || "{}");
  const existingCustomers = await stripe.customers.list({
    email,
  });
  const customer = existingCustomers.data.length
    ? existingCustomers.data[0]
    : await stripe.customers.create({
        email,
        name,
      });
  return {
    statusCode: 200,
    body: JSON.stringify({
      customer: customer.id,
    }),
    headers,
  };
};
