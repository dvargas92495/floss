import { GetStaticProps } from "next";
import Link from "next/link";

import { Issue } from "../../interfaces";
import { sampleIssueData } from "../../utils/sample-data";
import Layout from "../../components/Layout";
import List from "../../components/List";

type Props = {
  items: Issue[];
};

const WithStaticProps = ({ items }: Props) => (
  <Layout title="Issues List | Floss">
    <h1>Issues List</h1>
    <List items={items} />
    <p>
      <Link href="/">
        <a>Go home</a>
      </Link>
    </p>
  </Layout>
);

export const getStaticProps: GetStaticProps = async () => {
  const items: Issue[] = sampleIssueData;
  return { props: { items } };
};

export default WithStaticProps;
