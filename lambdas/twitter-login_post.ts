import axios from "axios";
import { headers, twitterOAuth } from "../utils/lambda";

export const handler = async () => {
  const oauthHeaders = twitterOAuth.toHeader(
    twitterOAuth.authorize({
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
          statusCode: 200,
          body: JSON.stringify({ token: parsedData.oauth_token }),
          headers,
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
