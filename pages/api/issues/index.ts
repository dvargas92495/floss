import { NextApiRequest, NextApiResponse } from "next";
import { sampleIssueData } from "../../../utils/sample-data";

const handler = (_req: NextApiRequest, res: NextApiResponse) => {
  try {
    if (!Array.isArray(sampleIssueData)) {
      throw new Error("Cannot find user data");
    }

    res.status(200).json(sampleIssueData);
  } catch (err) {
    res.status(500).json({ statusCode: 500, message: err.message });
  }
};

export default handler;
