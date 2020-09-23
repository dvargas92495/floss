import { APIGatewayEvent } from "aws-lambda";
import { dynamo, headers, stripe } from "../utils/lambda";
import axios from "axios";

export const handler = async (event: APIGatewayEvent) => {
  const { link, reward, dueDate } = JSON.parse(event.body || "{}");
  return axios(link.replace("github.com", "api.github.com/repos")).then(
    (issue) =>
      issue.data.state === "open"
        ? stripe.checkout.sessions
            .create({
              payment_method_types: ["card"],
              line_items: [
                {
                  price_data: {
                    currency: "usd",
                    product_data: {
                      name: "Github Issue",
                      description: link,
                    },
                    unit_amount: reward,
                  },
                  quantity: 1,
                },
              ],
              mode: "payment",
              success_url:
                "https://floss.davidvargas.me/contracts?success=true",
              cancel_url: "https://floss.davidvargas.me/contracts?cancel=true",
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
            )
        : {
            statusCode: 400,
            body: `Issue ${link} is not open`,
            headers,
          }
  );
};
