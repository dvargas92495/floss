import Layout from "../../components/Layout";
import List from "../../components/List";
import { Typography } from "@material-ui/core";
import { GetStaticProps } from "next";
import { useEffect, useState } from "react";

const IssueList = () => {
  const [items, setItems] = useState([]);
  useEffect(() => {
    fetch(
      `https://${process.env.NEXT_PUBLIC_REST_API_ID}.execute-api.us-east-1.amazonaws.com/production/github-issues`
    )
      .then((res) => res.json())
      .then((res) => {
        setItems(
          res.map((item: any) => ({
            repository: item.repository.full_name,
            id: item.id,
            issue: item.number,
            reward: 0,
          }))
        );
      });
  }, [setItems]);
  return <List items={items} />;
};

const WithStaticProps = () => (
  <Layout title="Issues List | Floss">
    <Typography variant="h1">Issues List</Typography>
    <IssueList />
  </Layout>
);

export const getStaticProps: GetStaticProps = async () => {
  return {
    props: { items: [] },
  };
};

export default WithStaticProps;
