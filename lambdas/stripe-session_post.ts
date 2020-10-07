import { APIGatewayEvent } from "aws-lambda";
import {
  dynamo,
  getEmailFromHeaders,
  getFlossUserByEmail,
  headers,
  stripe,
  toPriority,
  validateGithubLink,
} from "../utils/lambda";
import { v4 } from "uuid";

export const handler = async (event: APIGatewayEvent) => {
  const {
    link,
    reward,
    dueDate,
    paymentMethod,
  }: {
    link: string;
    dueDate: string;
    reward: number;
    paymentMethod: string;
  } = JSON.parse(event.body || "{}");
  const reqHeaders = event.headers;
  const response = await validateGithubLink(link);
  if (response.body) {
    return response;
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
  const customer = flossUser.Items[0].client.S;
  const putItemProps = (sessionId: string) => ({
    Item: {
      uuid: {
        S: uuid,
      },
      stripe: {
        S: sessionId,
      },
      link: {
        S: link,
      },
      priority: {
        S: toPriority({ reward, dueDate }),
      },
      lifecycle: {
        S: paymentMethod ? "active" : "pending",
      },
      createdBy: {
        S: createdBy,
      },
    },
    TableName: "FlossContracts",
  });
  return paymentMethod
    ? stripe.paymentIntents
        .create({
          customer,
          amount: reward * 100,
          currency: "usd",
        })
        .then((paymentIntent) =>
          dynamo
            .putItem(putItemProps(paymentIntent.id))
            .promise()
            .then(() => ({
              statusCode: 200,
              body: JSON.stringify({ active: true }),
              headers,
            }))
        )
    : stripe.checkout.sessions
        .create({
          customer,
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
            .putItem(putItemProps(session.payment_intent as string))
            .promise()
            .then(() => ({
              statusCode: 200,
              body: JSON.stringify({ id: session.id, active: false }),
              headers,
            }))
        );
};
