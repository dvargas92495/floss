import { APIGatewayEvent } from "aws-lambda";
import axios, { AxiosError } from "axios";
import Stripe from "stripe";

export const handler = async (event: APIGatewayEvent) => {
  const body: { data: { object: Stripe.Checkout.Session } } = JSON.parse(
    event.body || "{}"
  );
  const { metadata } = body.data.object;
  if (metadata?.callback) {
    return axios
      .post(metadata.callback, body, {
        headers: Object.fromEntries(
          Object.entries(event.headers)
            .filter(([h]) => h.toLowerCase() !== "host")
            .concat([["stripe-body", event.body || "{}"]])
        ),
      })
      .then((r) => ({
        statusCode: r.status,
        body: JSON.stringify(r.data),
        headers: r.headers,
      }))
      .catch((e: AxiosError) => ({
        statusCode: e.response?.status || 500,
        body:
          typeof e.response?.data === "object"
            ? JSON.stringify(e.response?.data)
            : e.response?.data,
        headers: e.response?.headers || {},
      }));
  }
  return {
    statusCode: 200,
    body: "No callback to proxy",
  };
};