import { APIGatewayEvent } from "aws-lambda";
import axios from "axios";
import { headers, twitterLogin, twitterOAuth } from "../utils/lambda";

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
      headers: oauthHeaders,
    })
    .then((r) => {
      const parsedData = Object.fromEntries(
        r.data.split("&").map((s: string) => s.split("="))
      );
      const { oauth_token, oauth_token_secret } = parsedData;
      return twitterLogin({ oauth_token, oauth_token_secret });
    })
    .catch((e) => ({
      statusCode: 500,
      body: JSON.stringify(e.response?.data || { message: e.message }),
      headers,
    }));
};
