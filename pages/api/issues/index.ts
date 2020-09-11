import { NextApiRequest, NextApiResponse } from "next";

const handler = (_req: NextApiRequest, res: NextApiResponse) => {
  fetch(
    `https://${process.env.REST_API_ID}.execute-api.us-east-1.amazonaws.com/production/`
  )
    .then((fetchedRes) => {
      res.status(fetchedRes.status);
      return fetchedRes.json();
    })
    .then((data) => res.json(data))
    .catch((err) =>
      res.status(500).json({ statusCode: 500, message: err.message })
    );
};

export default handler;
