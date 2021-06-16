import { APIGatewayProxyHandler } from "aws-lambda";
import { Stripe } from "stripe";
import { dynamo, getAxiosByGithubLink, headers, stripe } from "../utils/lambda";

export const handler: APIGatewayProxyHandler = async (event) =>
  event.queryStringParameters?.tenant
    ? dynamo
        .query({
          TableName: "FlossProjects",
          KeyConditionExpression: "tenant = :s",
          IndexName: "tenant-index",
          ExpressionAttributeValues: {
            ":s": {
              S: event.queryStringParameters.tenant,
            },
          },
        })
        .promise()
        .then((r) => {
          const projects = {} as {
            [uuid: string]: {
              progress: number;
              target: number;
              link: string;
            };
          };
          (r.Items || []).forEach((i) => {
            const project = projects[i.uuid?.S || ""] ||
              projects[i.link?.S?.substring("floss_".length) || ""] || {
                progress: 0,
              };
            if (i.link?.S?.startsWith?.("link_")) {
              project.target = Number(i.funding.N);
              project.link = i.link.S.substring("link_".length);
              projects[i.uuid?.S || ""] = project;
            } else {
              project.progress += Number(i.funding.N);
              projects[i.link?.S?.substring("floss_".length) || ""] = project;
            }
          });
          return Promise.all(
            Object.entries(projects).map(([uuid, { link, ...rest }]) =>
              event.queryStringParameters?.simple === "true"
                ? { uuid, ...rest, name: link }
                : getAxiosByGithubLink(link).then((r) => ({
                    uuid,
                    ...rest,
                    name: r.name || r.title,
                  }))
            )
          ).then((body) => ({
            statusCode: 200,
            body: JSON.stringify({
              projects: body,
            }),
            headers,
          }));
        })
        .catch((e) => ({
          statusCode: 500,
          body: e.message,
          headers,
        }))
    : event.queryStringParameters?.uuid
    ? Promise.all([
        event.queryStringParameters?.simple === "true"
          ? Promise.resolve({})
          : dynamo
              .getItem({
                TableName: "FlossProjects",
                Key: { uuid: { S: event.queryStringParameters.uuid } },
              })
              .promise()
              .then((r) =>
                getAxiosByGithubLink(
                  r.Item?.link.S?.substring("link_".length)
                ).then((g) => ({
                  name: g.name || g.title,
                  description: g.body.substring(50),
                  body: g.body,
                  uuid: r.Item?.uuid.S,
                  target: Number(r.Item?.funding?.N),
                }))
              ),
        dynamo
          .query({
            TableName: "FlossProjects",
            KeyConditionExpression: "link = :s",
            IndexName: "link-index",
            ExpressionAttributeValues: {
              ":s": {
                S: `floss_${event.queryStringParameters.uuid}`,
              },
            },
          })
          .promise()
          .then((r) =>
            Promise.all(
              (r.Items || []).map((i) =>
                stripe.customers.retrieve(i.createdBy?.S || "").then((c) => ({
                  createdBy: (c as Stripe.Customer).name,
                  funding: Number(i.funding.N),
                  uuid: i.uuid.S,
                }))
              )
            )
          ),
      ])
        .then(([parent, backers]) => ({
          statusCode: 200,
          body: JSON.stringify({
            ...parent,
            backers,
          }),
          headers,
        }))
        .catch((e) => {
          console.error(e);
          return {
            statusCode: 500,
            body: e.message,
            headers,
          };
        })
    : { statusCode: 400, body: "parameter 'uuid' or 'tenant' are required" };
