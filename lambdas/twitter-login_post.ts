import OAuth from "oauth-1.0a";
import crypto from "crypto";
import axios from "axios";
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
      method: "POST",
    })
  );

  return axios
    .post(
      "https://api.twitter.com/oauth/request_token",
      {
        oauth_callback: `https://floss.davidvargas.me/auth?twitter=true`,
      },
      { headers: oauthHeaders }
    )
    .then((r) => {
      const parsedData = Object.fromEntries(
        r.data.split("&").map((s: string) => s.split("="))
      );
      if (parsedData.oauth_callback_confirmed) {
        return {
          statusCode: 302,
          headers: {
            ...headers,
            Location: `https://api.twitter.com/oauth/authenticate?oauth_token=${parsedData.oauth_token}`,
          },
        };
      } else {
        return {
          statusCode: 500,
          body: "Oauth Callback was not Confirmed",
          headers,
        };
      }
    });
};
