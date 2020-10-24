import { APIGatewayEvent } from "aws-lambda";
import { twitterLogin } from "../utils/lambda";

export const handler = async (event: APIGatewayEvent) => {
  const { oauth_token, oauth_token_secret } = JSON.parse(event.body || "{}");
  return twitterLogin({ oauth_token, oauth_token_secret });
};
