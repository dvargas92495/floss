import AWS from "aws-sdk";
import { APIGatewayProxyEvent } from "aws-lambda";
import { headers } from "../utils/lambda";

const route53domains = new AWS.Route53Domains({
  apiVersion: "2014-05-15",
});
const route53 = new AWS.Route53({ apiVersion: "2013-04-01" });

const hasHostedZoneByName = async (domain: string) => {
  let finished = false;
  let Marker: string | undefined = undefined;
  while (!finished) {
    const zones: AWS.Route53.ListHostedZonesResponse = await route53
      .listHostedZones({ Marker })
      .promise();
    const { HostedZones, IsTruncated, NextMarker } = zones;
    const zone = HostedZones.some((i) => i.Name === `${domain}.`);
    if (zone) {
      return true;
    }
    finished = !IsTruncated;
    Marker = NextMarker;
  }

  return false;
};

export const handler = async (event: APIGatewayProxyEvent) => {
  const domainParts = (
    event.queryStringParameters?.domain || "davidvargas.me"
  ).split(".");
  const DomainName = domainParts.slice(domainParts.length - 2).join(".");
  const { Availability } = await route53domains
    .checkDomainAvailability({
      DomainName,
    })
    .promise();
  if (Availability === "AVAILABLE") {
    return {
      statusCode: 200,
      body: JSON.stringify({ available: true }),
      headers,
    };
  }

  const available = await hasHostedZoneByName(DomainName);
  return {
    statusCode: 200,
    body: JSON.stringify({ available }),
    headers,
  };
};
