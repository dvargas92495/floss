import { APIGatewayEvent } from "aws-lambda";
import axios from "axios";
import { headers, twitterOAuth, upsertUser } from "../utils/lambda";

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
            url: `https://api.twitter.com/1.1/account/verify_credentials.json?skip_status=true&include_email=true`,
            method: "GET",
          },
          { key: oauth_token, secret: oauth_token_secret }
        )
      );
      return axios
        .get(
          `https://api.twitter.com/1.1/account/verify_credentials.json?skip_status=true&include_email=true`,
          {
            headers: credentialHeaders,
          }
        )
        .then(async (c) => {
          const { name, email, profile_image_url_https: avatar_url } = c.data;
          const accessToken = JSON.stringify({
            oauth_token,
            oauth_token_secret,
          });
          await upsertUser(name, email, accessToken);
          return {
            statusCode: 200,
            body: JSON.stringify({
              name,
              email,
              avatar_url,
              accessToken,
            }),
            headers,
          };
        });
    })
    .catch((e) => ({
      statusCode: 500,
      body: JSON.stringify(e.response?.data || { message: e.message }),
      headers,
    }));
};
