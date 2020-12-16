import { APIGatewayEvent } from "aws-lambda";
import { headers, stripe } from "../utils/lambda";
import { ManagementClient } from "auth0";

const client = new ManagementClient({
  clientId: process.env.AUTH0_CLIENT_ID || "",
  clientSecret: process.env.AUTH0_CLIENT_SECRET || "",
  domain: "vargas-arts.us.auth0.com",
});

const resolveName = (name: string) => {
  switch (name) {
    case "Username-Password-Authentication":
      return "auth0";
    case "google-oauth2":
      return "google-oauth2";
    default:
      return "";
  }
};

export const handler = async (event: APIGatewayEvent) => {
  const {
    user: { id: userId, email },
    context: {
      connection: { name },
    },
  } = JSON.parse(event.body || "{}");
  const id = `${resolveName(name)}|${userId}`;
  const existingCustomers = await stripe.customers.list({
    email,
  });
  const customer = existingCustomers.data.length
    ? existingCustomers.data[0]
    : await stripe.customers.create({
        email,
      });
  await client.updateAppMetadata({ id }, { stripe: customer.id });
  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
    }),
    headers,
  };
};
