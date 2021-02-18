import { APIGatewayEvent } from "aws-lambda";
import axios from "axios";
import { activateContractByStripeId, headers } from "../utils/lambda";

export const handler = async (event: APIGatewayEvent) => {
  const {
    data: {
      object: { payment_intent, setup_intent, mode, metadata },
    },
  } = JSON.parse(event.body || "{}");
  const contractStripeId = payment_intent || setup_intent;
  if (contractStripeId) {
    return activateContractByStripeId(contractStripeId);
  } else if (mode === "subscription") {
    const { url, ...data } = metadata;
    return axios
      .post(url, data)
      .then((r) => ({
        statusCode: r.status,
        body: JSON.stringify(r.data),
        headers: r.headers,
      }));
  }
  return {
    statusCode: 204,
    body: JSON.stringify({}),
    headers,
  };
};
