import { APIGatewayEvent } from "aws-lambda";
import axios from "axios";
import Stripe from "stripe";
import { activateContract, headers, stripe } from "../utils/lambda";

export const handler = async (event: APIGatewayEvent) => {
  const {
    data: {
      object: { payment_intent, mode, metadata, customer, setup_intent },
    },
  }: { data: { object: Stripe.Checkout.Session } } = JSON.parse(
    event.body || "{}"
  );
  if (metadata?.skipCallback === "true") {
    return {
      statusCode: 204,
      body: JSON.stringify({}),
      headers,
    };
  }
  switch (mode) {
    case "setup":
      return activateContract({
        id: setup_intent as string,
        payment_method: await stripe.setupIntents
          .retrieve(setup_intent as string)
          .then((s) => s.payment_method),
        customer,
      });
    case "payment":
      return activateContract({
        id: payment_intent as string,
        payment_method: await stripe.paymentIntents
          .retrieve(payment_intent as string)
          .then((s) => s.payment_method),
        customer,
      });
    case "subscription":
      const { url, ...data } = metadata || {};
      return axios.post(url, data).then((r) => ({
        statusCode: r.status,
        body: JSON.stringify(r.data),
        headers: r.headers,
      }));
  }
};
