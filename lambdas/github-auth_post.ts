import { APIGatewayEvent } from "aws-lambda";
import axios from 'axios';
import { headers } from "../utils/lambda";

export const handler = async (event: APIGatewayEvent) => {
  const { code } = JSON.parse(event.body || "{}");
  return axios.post('https://github.com/login/oauth/access_token', {
    client_id: process.env.OAUTH_CLIENT_ID,
    client_secret: process.env.OAUTH_CLIENT_SECRET,
    code,
    accept: 'json'
  }).then(r => ({
    statusCode: 200,
    body: r.data,
    headers,
  })).catch(e => ({
    statusCode: 500,
    body: e.response?.data || e.message,
    headers,
  }))
};
