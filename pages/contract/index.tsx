import { Contract } from "../../interfaces";
import Layout from "../../components/Layout";
import React, { useCallback, useState } from "react";
import Typography from "@material-ui/core/Typography";
import { API_URL } from "../../utils/client";
import MuiLink from "@material-ui/core/Link";
import axios from "axios";
import { DataLoader } from "@dvargas92495/ui";

const GithubDisplay = ({ link }: { link: string }) => {
  const [name, setName] = useState("");
  const getIssue = useCallback(
    () =>
      axios
        .get(link.replace("https://github.com", "https://api.github.com/repos"))
        .then((issue) => setName(issue.data.title)),
    [setName]
  );
  return (
    <DataLoader loadAsync={getIssue}>
      <Typography variant={"h5"}>
        <MuiLink href={link}>{name}</MuiLink>
      </Typography>
    </DataLoader>
  );
};

const StaticPropsDetail = () => {
  const [contract, setContract] = useState<Contract>();
  const getContract = useCallback(() => {
    const query = new URLSearchParams(window.location.search);
    const uuid = query.get("id");
    return axios
      .get(`${API_URL}/contract?uuid=${uuid}`)
      .then((res) => setContract(res.data));
  }, [setContract]);
  return (
    <Layout title={`Contract Detail | Floss`}>
      <DataLoader loadAsync={getContract}>
        <Typography variant={"h1"}>
          ${contract?.reward} - {contract?.lifecycle?.toUpperCase()}
        </Typography>
        <GithubDisplay link={contract?.link || ""} />
        <Typography variant={"subtitle1"}>
          Due on: {contract?.dueDate}
        </Typography>
        <Typography variant={"subtitle1"}>
          Created by {contract?.createdBy} on {contract?.createdDate}
        </Typography>
      </DataLoader>
    </Layout>
  );
};

export default StaticPropsDetail;
