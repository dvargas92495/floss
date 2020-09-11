import Layout from "../components/Layout";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import Link from "next/link";

const IndexPage = () => (
  <Layout title="Floss | FreeLance Open Source Software">
    <Typography variant="h1">Floss</Typography>
    <Typography variant="subtitle1">
      <i>FreeLance Open Source Software</i>
    </Typography>
    <Link href="/issues">
      <Button color="secondary" variant="contained">
        VIEW ISSUES
      </Button>
    </Link>
    <Typography variant="body1">
      Small software companies rely heavily on open source software, but often
      don't have the resources to dedicate an engineer towards fixing road
      blocks that come up in the projects thay use. Open source developers are
      often searching for projects to contribute to while also looking for ways
      to support their work.
    </Typography>
    <Typography variant="body1">Enter Floss.</Typography>
    <Typography variant="body1">
      Small companies could pull Github issues into the platform, posting them
      with a financial reward for closing the issue. The developer who closes
      the issue could then claim the reward. The company that posted the issue
      will then confirm the claim, using the git history to verify that the
      developer did close the issue. The reward could be far cheaper than it
      costs for the company to employ resources into fixing, but enough to
      incentivize open source developers to tackle multiple of them to sustain
      their own work.
    </Typography>
    <Typography variant="body1">
      Floss. For that issue you know should be fixed, but don't want to put
      aside the resources into fixing.
    </Typography>
  </Layout>
);

export default IndexPage;
