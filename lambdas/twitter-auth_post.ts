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
      headers: oauthHeaders,
    })
    .then((r) => {
      const parsedData = Object.fromEntries(
        r.data.split("&").map((s: string) => s.split("="))
      );
      const { oauth_token } = parsedData;
      const credentialHeaders = twitterOAuth.toHeader(
        twitterOAuth.authorize({
          url: `https://api.twitter.com/1.1/account/verify_credentials?oauth_token=${oauth_token}`,
          method: "GET",
        })
      );
      console.log(parsedData);
      console.log(credentialHeaders);
      return axios
        .get(
          `https://api.twitter.com/1.1/account/verify_credentials?oauth_token=${oauth_token}`,
          {
            headers: credentialHeaders,
          }
        )
        .then((c) => ({
          statusCode: 200,
          body: JSON.stringify(c.data),
          headers,
        }));
    })
    .catch((e) => ({
      statusCode: 500,
      body: JSON.stringify(e.response?.data || { message: e.message }),
      headers,
    }));
};
