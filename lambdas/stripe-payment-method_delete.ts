import { APIGatewayEvent } from "aws-lambda";
import { headers, stripe } from "../utils/lambda";

export const handler = async (event: APIGatewayEvent) => {
  const paymentMethodId = event.queryStringParameters?.payment_method_id;
  if (!paymentMethodId) {
    return {
      statusCode: 400,
      body: "payment_method_id is required",
      headers,
    }
  }

  await stripe.paymentMethods.detach(paymentMethodId);
  return {
    statusCode: 204,
    body: JSON.stringify({}),
    headers,
  };
};
