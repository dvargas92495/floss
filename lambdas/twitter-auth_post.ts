import { APIGatewayEvent } from "aws-lambda";
import axios from "axios";
import { headers, twitterOAuth } from "../utils/lambda";

export const handler = async (event: APIGatewayEvent) => {
  const data = JSON.parse(event.body || "{}");
  const oauthHeaders = twitterOAuth.toHeader(
    twitterOAuth.authorize({
      data,
      url: "https://api.twitter.com/oauth/access_token",
      method: "POST",
    })
  );

  return axios
    .post("https://api.twitter.com/oauth/access_token", data, {
      headers: {
        ...oauthHeaders,
        Accept: "application/json",
      },
    })
    .then((r) => ({
      statusCode: 200,
      body: JSON.stringify(r.data),
      headers,
    }));
};
