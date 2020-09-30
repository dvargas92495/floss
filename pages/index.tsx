import Layout from "../components/Layout";
import Typography from "@material-ui/core/Typography";
import React from "react";
import Logo from "../components/Logo";
import Grid from "@material-ui/core/Grid";

const IndexPage = () => (
  <Layout title="Floss | FreeLance Open Source Software">
    <Grid container direction="column" alignItems="center">
      <Typography variant="h1">
        <Logo size={10} />
      </Typography>
      <Typography variant="subtitle1">
        <i>FreeLance Open Source Software</i>
      </Typography>
    </Grid>
  </Layout>
);

export default IndexPage;
