import { Issue } from "../../interfaces";
import Layout from "../../components/Layout";
import List from "../../components/List";
import { Typography } from "@material-ui/core";
import { GetStaticProps } from "next";

type Props = {
  items: Issue[];
};

const WithStaticProps = ({ items }: Props) => (
  <Layout title="Issues List | Floss">
    <Typography variant="h1">Issues List</Typography>
    <List items={items} />
  </Layout>
);

export const getStaticProps: GetStaticProps = async () => {
  const res = await fetch(
    `https://${process.env.REST_API_ID}.execute-api.us-east-1.amazonaws.com/production/`
  );
  const items = await res.json();
  return {
    props: { items },
  };
};

export default WithStaticProps;
