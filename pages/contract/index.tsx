import { Issue } from "../../interfaces";
import Layout from "../../components/Layout";
import React, { useEffect, useState } from "react";
import Typography from "@material-ui/core/Typography";
import { API_URL } from "../../utils/client";
import Link from "next/link";
import Button from "@material-ui/core/Button";
import MuiLink from "@material-ui/core/Link";
import axios from "axios";

const GithubDisplay = ({ link }: { link: string }) => {
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  useEffect(() => {
    axios
      .get(link.replace("https://github.com", "https://api.github.com/repos"))
      .then((issue) => {
        setName(issue.data.title);
        setLoading(false);
      });
  }, [setName, setLoading]);
  return loading ? (
    <Typography variant={"h5"}>Loading...</Typography>
  ) : (
    <Typography variant={"h5"}>
      <MuiLink href={link}>{name}</MuiLink>
    </Typography>
  );
};

const StaticPropsDetail = () => {
  const [contract, setContract] = useState<Issue>();
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const uuid = query.get("uuid");
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
      <Link href="/contracts">
        <Button color="secondary" variant="contained">
          VIEW CONTRACTS
        </Button>
      </Link>
    </Layout>
  );
};

export default StaticPropsDetail;
