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
      const { oauth_token, oauth_token_secret } = parsedData;
      const credentialHeaders = twitterOAuth.toHeader(
        twitterOAuth.authorize(
          {
            url: `https://api.twitter.com/1.1/account/verify_credentials.json`,
            method: "GET",
          },
          { key: oauth_token, secret: oauth_token_secret }
        )
      );
      console.log(parsedData);
      console.log(credentialHeaders);
      return axios
        .get(`https://api.twitter.com/1.1/account/verify_credentials.json`, {
          headers: credentialHeaders,
        })
        .then((c) => ({
          statusCode: 200,
          body: JSON.stringify({ d: c.data, u: {
            name: c.data.name,
            email: c.data.email,
            avatar_url: c.data.profile_image_url_https,
            accessToken: c.data.oauth_token
          }}),
          headers,
        }));
    })
    .catch((e) => ({
      statusCode: 500,
      body: JSON.stringify(e.response?.data || { message: e.message }),
      headers,
    }));
};
