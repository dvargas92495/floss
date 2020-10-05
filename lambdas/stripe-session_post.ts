import { APIGatewayEvent } from "aws-lambda";
import {
  dynamo,
  getEmailFromHeaders,
  getFlossUserByEmail,
  headers,
  stripe,
  toPriority,
} from "../utils/lambda";
import axios from "axios";
import { v4 } from "uuid";

export const handler = async (event: APIGatewayEvent) => {
  const {
    link,
    reward,
    dueDate,
  }: {
    link: string;
    dueDate: string;
    reward: number;
  } = JSON.parse(event.body || "{}");
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

  const createdBy = await getEmailFromHeaders(reqHeaders.Authorization);
  const flossUser = await getFlossUserByEmail(createdBy);
  if (flossUser.Count === 0 || !flossUser.Items) {
    return {
      statusCode: 500,
      body: `Could not find Floss user for ${createdBy}`,
      headers,
    };
  }
  const uuid = v4();
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
              S: uuid,
            },
            stripe: {
              S: session.payment_intent as string,
            },
            link: {
              S: link,
            },
            priority: {
              S: toPriority({ reward, dueDate }),
            },
            lifecycle: {
              S: "pending",
            },
            createdBy: {
              S: createdBy,
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
