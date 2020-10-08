import { Issue } from "../../interfaces";
import Layout from "../../components/Layout";
import React, { useEffect, useState } from "react";
import Typography from "@material-ui/core/Typography";
import { API_URL } from "../../utils/client";
import MuiLink from "@material-ui/core/Link";
import axios from "axios";
import Grid from "@material-ui/core/Grid";
import ContractList from "../../components/ContractList";

const IssuePage = () => {
  const [issue, setIssue] = useState<Issue>();
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const link = query.get("id");
    axios
      .get(`${API_URL}/issue?link=${link}`)
      .then((issue) => setIssue(issue.data));
  }, [setIssue]);
  return (
    <Layout title={`Issue Detail | Floss`}>
      {issue ? (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant={"h1"}>
              ${issue.contracts.reduce((n, c) => c.reward + n, 0)} -{" "}
              {issue.state.toUpperCase()}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant={"h5"}>
              <MuiLink href={issue.link}>{issue.title}</MuiLink>
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant={"body1"}>{issue.body}</Typography>
          </Grid>
          <ContractList items={issue.contracts} />
        </Grid>
      ) : (
        <Typography variant={"body2"}>Loading...</Typography>
      )}
    </Layout>
  );
};

export default IssuePage;
