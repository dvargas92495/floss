import { APIGatewayEvent } from "aws-lambda";
import {
  auth0Client,
  getAuth0UserFromEvent,
  headers,
  stripe,
} from "../utils/lambda";

export const handler = async (event: APIGatewayEvent) => {
  const { name } = JSON.parse(event.body || "{}");
  const user = await getAuth0UserFromEvent(event);
  const { app_metadata } = await auth0Client.updateUser(
    { id: user.sub },
    { name }
  );
  if (app_metadata?.stripe) {
    stripe.customers.update(app_metadata.stripe, { name });
  }
  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
    }),
    headers,
  };
};
