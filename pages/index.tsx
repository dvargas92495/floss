import Layout from "../components/Layout";
import Typography from "@material-ui/core/Typography";
import React from "react";
import FlossLogo from "../components/FlossLogo";
import Grid from "@material-ui/core/Grid";

const IndexPage = () => (
  <Layout title="Floss | FreeLance Open Source Software">
    <Grid container direction="column" alignItems="center">
      <Typography variant="h1">
        <FlossLogo size={20} />
      </Typography>
      <Typography variant="subtitle1">
        <i>FreeLance Open Source Software</i>
      </Typography>
    </Grid>
  </Layout>
);

export default IndexPage;
