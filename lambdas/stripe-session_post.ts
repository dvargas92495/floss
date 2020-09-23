import { APIGatewayEvent } from "aws-lambda";
import { dynamo, getFlossUserByEmail, headers, stripe } from "../utils/lambda";
import axios from "axios";

export const handler = async (event: APIGatewayEvent) => {
  const { link, reward, dueDate } = JSON.parse(event.body || "{}");
  const reqHeaders = event.headers;
  const issue = await axios.get(
    link.replace("github.com", "api.github.com/repos")
  );
  if (issue.data.state !== "open") {
    return {
      statusCode: 400,
      body: `Issue ${link} is not open`,
      headers,
    };
  }

  const user = await axios.get("https://api.github.com/user", {
    headers: {
      Authorization: reqHeaders.Authorization,
    },
  });
  const flossUser = await getFlossUserByEmail(user.data.email);
  if (flossUser.Count === 0 || !flossUser.Items) {
    return {
      statusCode: 500,
      body: `Could not find Floss user for ${user.data.email}`,
      headers,
    };
  }
  return stripe.checkout.sessions
    .create({
      customer: flossUser.Items[0].client.S,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Github Issue",
              description: link,
            },
            unit_amount: reward * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${reqHeaders.Origin}/contracts?success=true`,
      cancel_url: `${reqHeaders.Origin}/contracts?cancel=true`,
    })
    .then((session) =>
      dynamo
        .putItem({
          Item: {
            uuid: {
              S: session.payment_intent as string,
            },
            link: {
              S: link,
            },
            reward: {
              N: `${reward}`,
            },
            dueDate: {
              S: dueDate,
            },
            lifecycle: {
              S: "pending",
            },
          },
          TableName: "FlossContracts",
        })
        .promise()
        .then(() => ({
          statusCode: 200,
          body: JSON.stringify({ id: session.id }),
          headers,
        }))
    );
};
