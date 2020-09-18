import Stripe from "stripe";
import { APIGatewayEvent } from "aws-lambda";
import { headers } from "../utils/lambda";
import axios from "axios";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2020-08-27",
});

export const handler = async (event: APIGatewayEvent) => {
  const { link, reward } = JSON.parse(event.body || "{}");
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
                cancel_url:
                  "https://floss.davidvargas.me/contracts?cancel=true",
              }).then(session => ({
                statusCode: 200,
                body: JSON.stringify(session),
                headers,
              }))
        : {
            statusCode: 400,
            body: `Issue ${link} is not open`,
            headers,
          }
  );
};
