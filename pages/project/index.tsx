import { Contract } from "../../interfaces";
import Layout from "../../components/Layout";
import React, { useEffect, useState } from "react";
import Typography from "@material-ui/core/Typography";
import { API_URL } from "../../utils/client";
import MuiLink from "@material-ui/core/Link";

const GithubDisplay = ({ link }: { link: string }) => {
  const [loading] = useState(false);
  const [name] = useState(link);
  return loading ? (
    <Typography variant={"h5"}>Loading...</Typography>
  ) : (
    <Typography variant={"h5"}>
      <MuiLink href={link}>{name}</MuiLink>
    </Typography>
  );
};

const StaticPropsDetail = () => {
  const [contract, setContract] = useState<Contract>();
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const uuid = query.get("id");
    fetch(`${API_URL}/contract?uuid=${uuid}`)
      .then((res) => res.json())
      .then((res) => setContract(res));
  }, [setContract]);
  return (
    <Layout title={`Contract Detail | Floss`}>
      {contract ? (
        <>
          <Typography variant={"h1"}>
            ${contract.reward} - {contract?.lifecycle?.toUpperCase()}
          </Typography>
          <GithubDisplay link={contract.link} />
          <Typography variant={"subtitle1"}>
            Due on: {contract.dueDate}
          </Typography>
          <Typography variant={"subtitle1"}>
            Created by {contract.createdBy} on {contract.createdDate}
          </Typography>
        </>
      ) : (
        <Typography variant={"body2"}>Loading...</Typography>
      )}
    </Layout>
  );
};

export default StaticPropsDetail;
