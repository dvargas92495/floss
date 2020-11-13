import { APIGatewayEvent } from "aws-lambda";
import {
  dynamo,
  getStripeCustomer,
  headers,
  stripe,
  toPriority,
  validateGithubLink,
} from "../utils/lambda";
import { v4 } from "uuid";
import Stripe from "stripe";

export const handler = async (event: APIGatewayEvent) => {
  const {
    link,
    reward,
    dueDate,
    paymentMethod,
    mode = "payment",
  }: {
    link: string;
    dueDate: string;
    reward: number;
    paymentMethod: string;
    mode?: Stripe.Checkout.SessionCreateParams.Mode;
  } = JSON.parse(event.body || "{}");
  const reqHeaders = event.headers;
  const response = await validateGithubLink(link);
  if (response.body) {
    return response;
  }

  const { customer, email: createdBy } = await getStripeCustomer(
    reqHeaders.Authorization
  );
  const uuid = v4();
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
          dynamo.putItem(putItemProps(paymentIntent.id)).promise()
        )
        .then(() => ({
          statusCode: 200,
          body: JSON.stringify({ active: true }),
          headers,
        }))
        .catch((e) => ({
          statusCode: 500,
          body: e.errorMessage || e.message,
          headers,
        }))
    : stripe.checkout.sessions
        .create({
          customer,
          payment_method_types: ["card"],
          line_items:
            mode === "setup"
              ? []
              : [
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
          mode,
          success_url: `${reqHeaders.Origin}/checkout?success=true`,
          cancel_url: `${reqHeaders.Origin}/checkout?cancel=true`,
        })
        .then((session) =>
          dynamo
            .putItem(
              putItemProps(
                (session.payment_intent || session.setup_intent) as string
              )
            )
            .promise()
            .then(() => ({
              statusCode: 200,
              body: JSON.stringify({ id: session.id, active: false }),
              headers,
            }))
        )
        .catch((e) => ({
          statusCode: 500,
          body: e.errorMessage || e.message,
          headers,
        }));
};
