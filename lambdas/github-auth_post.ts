import { APIGatewayEvent } from "aws-lambda";
import axios from "axios";
import { v4 } from "uuid";
import {
  dynamo,
  getEmailFromHeaders,
  getFlossUserByEmail,
  getUser,
  headers,
  sendMeEmail,
  stripe,
  upsertUser,
} from "../utils/lambda";

export const handler = async (event: APIGatewayEvent) => {
  const { code } = JSON.parse(event.body || "{}");
  return axios
    .post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.OAUTH_CLIENT_ID,
        client_secret: process.env.OAUTH_CLIENT_SECRET,
        code,
        scope: "read:user user:email",
      },
      {
        headers: {
          Accept: "application/json",
        },
      }
    )
    .then(async (r) => {
      const accessToken = r.data.access_token as string;
      const Authorization = `token ${accessToken}`;
      const { name, avatar_url } = await getUser(Authorization);
      const email = await getEmailFromHeaders(Authorization);

      if (!email) {
        return sendMeEmail(
          `Floss 500 Error: github-auth/post`,
          `
  Message: Could not find email for Github User ${name}
          `
        ).then(() => ({
          statusCode: 500,
          body: "Could not find email for Github User",
          headers,
        }));
      }
      await upsertUser(name, email, accessToken);

      return {
        statusCode: 200,
        body: JSON.stringify({ email, name, accessToken, avatar_url }),
        headers,
      };
    })
    .catch((e) =>
      sendMeEmail(
        `Floss 500 Error: github-auth/post`,
        `
Response: ${JSON.stringify(e.response)}
                   
Message: ${e.message}
        `
      ).then(() => ({
        statusCode: 500,
        body: e.response?.data || e.message,
        headers,
      }))
    );
};
