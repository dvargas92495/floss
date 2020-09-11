import axios from "axios";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
};

export const handler = () => axios(`https://api.github.com/issues?filter=subscribed&state=open`, {
    headers: {
      Accept: "application/vnd.github.inertia-preview+json",
      Authorization: `Basic ${Buffer.from(
        `dvargas92495:${process.env.PERSONAL_ACCESS_TOKEN}`
      ).toString("base64")}`,
    },
  }).then((r) => ({
    statusCode: 200,
    body: JSON.stringify(r.data),
    headers,
  }))
  .catch((e) => ({
    statusCode: 500,
    body: e.message,
    headers,
  }));
