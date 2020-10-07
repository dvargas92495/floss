import Layout from "../../components/Layout";
import Typography from "@material-ui/core/Typography";
import Grid from "@material-ui/core/Grid";
import React from "react";
import Container from "@material-ui/core/Container";

const AboutPage = () => (
  <Layout title="About | Floss">
    <Container maxWidth={"lg"}>
      <Grid container spacing={4}>
        <Grid item xs={12}></Grid>
        <Grid item xs={12}>
          <Typography variant="body1">
            Everyone heavily relies on open source software. But, they often
            aren't willing to dedicate resources towards fixing road blocks that
            come up in the libraries thay use.
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="body1">Enter Floss.</Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="body1">
            Clients could fund open source initiatives by creating Github
            Contracts. The work we handle for our clients could be anything as
            long as the end result is open source. Stuck on a Github Issue for
            an npm package you're using? We could fix it for you. Have an idea
            for a sweet new public tool? We could build it for you. The
            possibilities are endless as long as we could ensure that the output
            is open for everyone.
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="body1">
            Floss. For that issue you know should be fixed, but don't want to
            put aside the resources into fixing.
          </Typography>
        </Grid>
        <Grid item xs={12}></Grid>
      </Grid>
    </Container>
  </Layout>
);

export default AboutPage;
