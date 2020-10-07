import { APIGatewayEvent } from "aws-lambda";
import axios from "axios";
import { v4 } from "uuid";
import {
  dynamo,
  getFlossUserByEmail,
  headers,
  sendMeEmail,
  stripe,
} from "../utils/lambda";

export const handler = async (event: APIGatewayEvent) => {
  const { code } = JSON.parse(event.body || "{}");
  return axios
    .post("https://github.com/login/oauth/access_token", {
      client_id: process.env.OAUTH_CLIENT_ID,
      client_secret: process.env.OAUTH_CLIENT_SECRET,
      code,
      accept: "json",
    })
    .then(async (r) => {
      const params = r.data.split("&") as string[];
      const accessToken = params
        .find((s) => s.split("=")[0] === "access_token")
        ?.substring("access_token=".length);
      const userResponse = await axios.get(
        `https://api.github.com/user?access_token=${accessToken}`,
        {
          headers: {
            Authorization: `token ${accessToken}`,
          },
        }
      );
      const { email, name, avatar_url } = userResponse.data;
      if (!email) {
        return {
          statusCode: 500,
          body: "Could not find email for Github User",
          headers,
        };
      }
      const dynamoResponse = await getFlossUserByEmail(email);

      if (!dynamoResponse.Items || dynamoResponse.Count === 0) {
        const client = await stripe.customers.create({
          email,
          name,
        });
        const uuid = v4();
        await dynamo
          .putItem({
            Item: {
              uuid: {
                S: uuid,
              },
              client: {
                S: client.id,
              },
              email: {
                S: email,
              },
              accessToken: {
                S: accessToken,
              },
            },
            TableName: "FlossUsers",
          })
          .promise();
      } else {
        const Item = dynamoResponse.Items[0];
        Item.accessToken.S = accessToken;
        await dynamo
          .putItem({
            Item,
            TableName: "FlossUsers",
          })
          .promise();
      }

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
                    
Login Params: ${JSON.stringify({
          client_id: process.env.OAUTH_CLIENT_ID,
          client_secret: process.env.OAUTH_CLIENT_SECRET,
          code,
          accept: "json",
        })}
        `
      ).then(() => ({
        statusCode: 500,
        body: e.response?.data || e.message,
        headers,
      }))
    );
};
