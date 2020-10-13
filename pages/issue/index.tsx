import { Issue } from "../../interfaces";
import Layout from "../../components/Layout";
import React, { useCallback, useEffect, useState } from "react";
import Typography from "@material-ui/core/Typography";
import { API_URL } from "../../utils/client";
import MuiLink from "@material-ui/core/Link";
import axios from "axios";
import marked from "marked";
import Grid from "@material-ui/core/Grid";
import ContractList from "../../components/ContractList";
import CreateGithubContractDialog from "../../components/CreateGithubContractDialog";

const IssuePage = () => {
  const [issue, setIssue] = useState<Issue>();
  const fetchIssue = useCallback(() => {
    const query = new URLSearchParams(window.location.search);
    const link = query.get("id");
    axios
      .get(`${API_URL}/issue?link=${link}`)
      .then((issue) => setIssue(issue.data));
  }, [setIssue]);
  useEffect(() => {
    fetchIssue();
  }, [fetchIssue]);
  return (
    <Layout title={`Issue Detail | Floss`}>
      {issue ? (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant={"h2"}>
              <MuiLink href={issue.link} target="_blank" rel="noopener">
                {issue.title}
              </MuiLink>
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant={"h5"}>
              ${issue.contracts.reduce((n, c) => c.reward + n, 0)} -{" "}
              {issue.state.toUpperCase()}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant={"body1"}>
              <div dangerouslySetInnerHTML={{ __html: marked(issue.body) }} />
            </Typography>
          </Grid>
          <ContractList items={issue.contracts} />
          <Grid item xs={12}>
            <CreateGithubContractDialog
              fetchContracts={fetchIssue}
              buttonText={"Fund Issue"}
              link={issue.link}
            />
          </Grid>
        </Grid>
      ) : (
        <Typography variant={"body2"}>Loading...</Typography>
      )}
    </Layout>
  );
};

export default IssuePage;
