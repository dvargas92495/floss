import AWS from "aws-sdk";
import { APIGatewayProxyEvent } from "aws-lambda";
import { headers } from "../utils/lambda";

const route53domains = new AWS.Route53Domains({
  apiVersion: "2014-05-15",
});
export const handler = async (event: APIGatewayProxyEvent) =>
  route53domains
    .checkDomainAvailability({
      DomainName: event.queryStringParameters?.domain || "floss.davidvargas.me",
    })
    .promise()
    .then(({ Availability }) => ({
      statusCode: 200,
      body: JSON.stringify({ Availability }),
      headers,
    }))
    .catch((e) => ({
      statusCode: 500,
      body: e.message,
      headers,
    }));
