import { APIGatewayEvent } from "aws-lambda";
import axios from "axios";
import Stripe from "stripe";
import { activateContract, headers, stripe } from "../utils/lambda";

export const handler = async (event: APIGatewayEvent) => {
  const {
    data: {
      object: { payment_intent, mode, metadata, customer },
    },
  }: { data: { object: Stripe.Checkout.Session } } = JSON.parse(
    event.body || "{}"
  );
  switch (mode) {
    case "setup":
      return {
        statusCode: 200,
        body: "Webhook moved",
        headers,
      };
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
