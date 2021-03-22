import { APIGatewayEvent } from "aws-lambda";
import { headers, stripe } from "../utils/lambda";

export const handler = async (event: APIGatewayEvent) => {
  const { id } = JSON.parse(event.body || "{}");
  if (!id) {
    return {
      statusCode: 400,
      body: "id is required",
      headers,
    };
  }

  return stripe.paymentMethods.retrieve(id).then((pm) => {
    if (!pm.customer) {
      return {
        statusCode: 400,
        body: "No customer attached to payment method",
        headers,
      };
    }
    return stripe.customers
      .update(pm.customer as string, {
        invoice_settings: {
          default_payment_method: pm.id,
        },
      })
      .then(() => ({
        statusCode: 200,
        body: JSON.stringify({ success: true }),
        headers,
      }));
  });
};
