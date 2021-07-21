import { APIGatewayEvent } from "aws-lambda";
import { headers, stripe, verifyFlossClient } from "../utils/lambda";

export const handler = async (event: APIGatewayEvent) => {
  const {
    customer,
  }: {
    customer: string;
  } = JSON.parse(event.body || "{}");
  const reqHeaders = event.headers;
  if (!verifyFlossClient(reqHeaders.Authorization)) {
    return {
      statusCode: 401,
      body: "Unauthorized",
      headers,
    };
  }
  const origin = reqHeaders.Origin || reqHeaders.origin;
  return stripe.checkout.sessions
    .create({
      customer,
      payment_method_types: ["card"],
      mode: "setup",
      metadata: {
        skipCallback: "true",
      },
      success_url: `${origin}/user`,
      cancel_url: `${origin}/user`,
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
