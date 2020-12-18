import AWS from "aws-sdk";
import format from "date-fns/format";
import Stripe from "stripe";
import axios, { AxiosResponse } from "axios";
import OAuth from "oauth-1.0a";
import crypto from "crypto";
import { v4 } from "uuid";
import { ManagementClient, AuthenticationClient } from "auth0";
import { APIGatewayEvent } from "aws-lambda";

AWS.config = new AWS.Config({ region: "us-east-1" });
export const dynamo = new AWS.DynamoDB({ apiVersion: "2012-08-10" });
export const ses = new AWS.SES({ apiVersion: "2010-12-01" });

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2020-08-27",
  maxNetworkRetries: 3,
});

export const auth0Client = new ManagementClient({
  clientId: process.env.AUTH0_CLIENT_ID || "",
  clientSecret: process.env.AUTH0_CLIENT_SECRET || "",
  domain: "vargas-arts.us.auth0.com",
});

export const auth0UserClient = new AuthenticationClient({
  clientId: process.env.AUTH0_CLIENT_ID || "",
  domain: "vargas-arts.us.auth0.com",
});

export const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
};

/**
 * sort order is
 * - Reward
 * - Due Date
 * - Created Date
 *
 * Because our sort order is ascending, we need to set reward to
 *    `MAX - reward`
 * so that highest rewards are prioritized
 */
export const MAX_REWARD = 9999;
const MAX_REWARD_LENGTH = MAX_REWARD.toString().length;
export const DATE_FORMAT = "yyyy-MM-dd";
const DATE_FORMAT_LENGTH = DATE_FORMAT.toString().length;

export const parsePriority = (r?: AWS.DynamoDB.AttributeMap) => {
  if (!r?.priority?.S) {
    return {};
  }
  const priority = r.priority.S;
  const reward =
    MAX_REWARD - parseInt(priority.substring(0, MAX_REWARD_LENGTH));
  const dueDateStart = MAX_REWARD_LENGTH + 1;
  const dueDate = priority.substring(
    dueDateStart,
    dueDateStart + DATE_FORMAT_LENGTH
  );
  const createdDateStart = dueDateStart + DATE_FORMAT_LENGTH + 1;
  const createdDate = priority.substring(
    createdDateStart,
    createdDateStart + DATE_FORMAT_LENGTH
  );
  return { dueDate, reward, createdDate };
};

export const toPriority = ({
  dueDate,
  reward,
}: {
  dueDate: string;
  reward: number;
}) => {
  return `${(MAX_REWARD - reward)
    .toString()
    .padStart(4, "0")}-${dueDate}-${format(new Date(), DATE_FORMAT)}`;
};

export const getActiveContracts = () =>
  dynamo
    .query({
      TableName: "FlossContracts",
      KeyConditionExpression: "priority >= :p and lifecycle = :s",
      IndexName: "lifecycle-priority-index",
      ExpressionAttributeValues: {
        ":p": {
          S: "0000-2020-10-02-2020-10-02",
        },
        ":s": {
          S: "active",
        },
      },
    })
    .promise();

export const getContractsByLink = (link: string) =>
  dynamo
    .query({
      TableName: "FlossContracts",
      KeyConditionExpression: "link = :l",
      IndexName: "link-index",
      ExpressionAttributeValues: {
        ":l": {
          S: link,
        },
      },
    })
    .promise();

export const getFlossUserByEmail = (email: string) =>
  dynamo
    .query({
      TableName: "FlossUsers",
      KeyConditionExpression: "email = :e",
      IndexName: "email-index",
      ExpressionAttributeValues: {
        ":e": {
          S: email,
        },
      },
    })
    .promise();

export const upsertUser = async (
  name: string,
  email: string,
  accessToken: string
) => {
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
};

export const activateContractByStripeId = (id: string) =>
  dynamo
    .query({
      TableName: "FlossContracts",
      KeyConditionExpression: "stripe = :s",
      IndexName: "stripe-index",
      ExpressionAttributeValues: {
        ":s": {
          S: id,
        },
      },
    })
    .promise()
    .then((r) =>
      r.Items?.length === 1
        ? dynamo
            .putItem({
              Item: {
                ...r.Items[0],
                lifecycle: {
                  S: "active",
                },
              },
              TableName: "FlossContracts",
              ReturnValues: "ALL_OLD",
            })
            .promise()
            .then((r) =>
              sendMeEmail(
                `New Floss Contract from ${r.Attributes?.createdBy.S} is Active`,
                `Check out the contract at https://floss.davidvargas.me/contract?uuid=${r.Attributes?.uuid.S}`
              )
            )
            .then(() => ({
              statusCode: 200,
              body: JSON.stringify({
                success: true,
              }),
              headers,
            }))
        : {
            statusCode: 500,
            body: `Failed to find one contract with stripe id ${id}`,
            headers,
          }
    )
    .catch((e) => ({
      statusCode: 500,
      body: e.message,
      headers,
    }));

export const getUser = async (Authorization: string) =>
  (
    await axios.get("https://api.github.com/user", {
      headers: {
        Authorization,
      },
    })
  ).data;

export const getEmailFromHeaders = (Authorization: string) => {
  if (Authorization.startsWith("Bearer ")) {
    return auth0UserClient
      .getProfile(Authorization.substring("Bearer ".length))
      .then((u) => u.email);
  } else if (Authorization.startsWith("token ")) {
    return axios
      .get(`https://api.github.com/user/emails`, {
        headers: {
          Authorization,
        },
      })
      .then(
        (r: AxiosResponse<{ primary: boolean; email: string }[]>) =>
          r.data.find((e) => e.primary)?.email || ""
      );
  } else if (Authorization.startsWith("Basic ")) {
    return Promise.resolve(
      Buffer.from(Authorization.substring("Basic ".length), "base64").toString()
    );
  } else {
    return Authorization;
  }
};

export const getStripeCustomer = async (Authorization: string) => {
  if (Authorization.startsWith("Bearer ")) {
    const user = await auth0UserClient.getProfile(
      Authorization.substring("Bearer ".length)
    );
    const { app_metadata } = await auth0Client.getUser({ id: user.sub });
    return {
      email: user.email,
      customer: app_metadata?.stripe,
    };
  }
  const email = await getEmailFromHeaders(Authorization);
  const flossUser = await getFlossUserByEmail(email);
  if (flossUser.Count === 0 || !flossUser.Items) {
    const customers = await stripe.customers.list({ email });
    if (customers.data.length > 1) {
      sendMeEmail(
        "Floss - getStripeCustomer - Warning",
        `Multiple customers with the email address ${email}`
      );
    }
    if (customers.data.length === 0) {
      const customer = (
        await stripe.customers.create({
          email,
        })
      ).id;
      return {
        customer,
        email,
      };
    } else {
      return {
        customer: customers.data[0].id,
        email,
      };
    }
  } else {
    return {
      email,
      customer: flossUser.Items[0].client.S || "",
    };
  }
};

export type GithubModel = {
  html_url: string;
  state: "open" | "closed";
  title: string;
  name: string;
  repository_url: string;
  columns_url: string;
  body: string;
  labels?: { name: string }[];
};

export const projectOpts = {
  headers: {
    Accept: 'application/vnd.github.inertia-preview+json"',
    Authorization: `token ${process.env.GITHUB_PERSONAL_ACCESS_TOKEN}`,
  },
};

export const getAxiosByGithubLink = async (link?: string) => {
  if (!link) {
    return {} as GithubModel;
  }
  const apiLink = link.replace("github.com", "api.github.com/repos");
  const isProject = apiLink.indexOf("/projects/") > -1;
  if (isProject) {
    const axiosUrl = `${apiLink.substring(
      0,
      apiLink.indexOf("/projects/") + "/projects".length
    )}?state=all`;
    const getProjects = axios.get(axiosUrl, projectOpts) as Promise<
      AxiosResponse<GithubModel[]>
    >;
    return getProjects.then(
      (projects) =>
        projects.data.find((p) => p.html_url === link) || ({} as GithubModel)
    );
  } else {
    const getIssue = axios.get(apiLink) as Promise<AxiosResponse<GithubModel>>;
    return getIssue.then((r) => r.data);
  }
};

export const validateGithubLink = async (link: string) => {
  const response = await getAxiosByGithubLink(link);
  if (response?.state !== "open") {
    return {
      statusCode: 400,
      body: `${link} is not open`,
      headers,
    };
  }

  return {};
};

export const sendMeEmail = (subject: string, body: string) =>
  ses
    .sendEmail({
      Destination: {
        ToAddresses: ["dvargas92495@gmail.com"],
      },
      Message: {
        Body: {
          Text: {
            Charset: "UTF-8",
            Data: body,
          },
        },
        Subject: {
          Charset: "UTF-8",
          Data: subject,
        },
      },
      Source: "no-reply@floss.davidvargas.me",
    })
    .promise();

export const twitterOAuth = new OAuth({
  consumer: {
    key: process.env.TWITTER_CONSUMER_KEY || "",
    secret: process.env.TWITTER_CONSUMER_SECRET || "",
  },
  signature_method: "HMAC-SHA1",
  hash_function(base_string, key) {
    return crypto.createHmac("sha1", key).update(base_string).digest("base64");
  },
});

export const twitterLogin = ({
  oauth_token,
  oauth_token_secret,
}: {
  oauth_token: string;
  oauth_token_secret: string;
}) => {
  const credentialHeaders = twitterOAuth.toHeader(
    twitterOAuth.authorize(
      {
        url: `https://api.twitter.com/1.1/account/verify_credentials.json?skip_status=true&include_email=true`,
        method: "GET",
      },
      { key: oauth_token, secret: oauth_token_secret }
    )
  );
  return axios
    .get(
      `https://api.twitter.com/1.1/account/verify_credentials.json?skip_status=true&include_email=true`,
      {
        headers: credentialHeaders,
      }
    )
    .then(async (c) => {
      const { name, email, profile_image_url_https: avatar_url } = c.data;
      const accessToken = JSON.stringify({
        oauth_token,
        oauth_token_secret,
      });
      await upsertUser(name, email, accessToken);
      return {
        statusCode: 200,
        body: JSON.stringify({
          name,
          email,
          avatar_url,
          accessToken,
        }),
        headers,
      };
    });
};

export const getAuth0UserFromEvent = (event: APIGatewayEvent) =>
  auth0UserClient.getProfile(
    event.headers.Authorization.substring("Bearer ".length)
  );
