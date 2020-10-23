import OAuth from "oauth-1.0a";
import crypto from "crypto";
import { headers } from "../utils/lambda";

export const handler = async () => {
  const oauth = new OAuth({
    consumer: {
      key: process.env.TWITTER_CONSUMER_KEY || "",
      secret: process.env.TWITTER_CONSUMER_SECRET || "",
    },
    signature_method: "HMAC-SHA1",
    hash_function(base_string, key) {
      return crypto
        .createHmac("sha1", key)
        .update(base_string)
        .digest("base64");
    },
  });
  const oauthHeaders = oauth.toHeader(
    oauth.authorize({
      data: {
        oauth_callback: "https://floss.davidvargas.me/auth?twitter=true",
      },
      url: "https://api.twitter.com/oauth/request_token",
      method: 'POST',
    })
  );

  return {
    statusCode: 200,
    body: JSON.stringify(oauthHeaders),
    headers,
  };
};
