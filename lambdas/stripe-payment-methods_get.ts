import { APIGatewayEvent } from "aws-lambda";
import {
  getEmailFromHeaders,
  getFlossUserByEmail,
  headers,
  stripe,
} from "../utils/lambda";

export const handler = async (event: APIGatewayEvent) => {
  const reqHeaders = event.headers;
  const email = await getEmailFromHeaders(reqHeaders.Authorization);
  const flossUser = await getFlossUserByEmail(email);
  if (flossUser.Count === 0 || !flossUser.Items) {
    return {
      statusCode: 500,
      body: `Could not find Floss user for ${email}`,
      headers,
    };
  }

  const customer = flossUser.Items[0].client.S || "";
  const paymentMethods = await stripe.paymentMethods.list({
    customer,
    type: "card",
  });

  return {
    statusCode: 200,
    body: JSON.stringify(
      paymentMethods.data.map((pm) => ({
        id: pm.id,
        brand: pm.card?.brand,
        last4: pm.card?.last4,
      }))
    ),
    headers,
  };
};
