import Layout from "../components/Layout";
import React from "react";
import FlossLogo from "../components/FlossLogo";
import { Landing } from "@dvargas92495/ui";

const IndexPage = () => (
  <Layout title="Floss | FreeLance Open Source Software">
    <Landing Logo={FlossLogo} subtitle={"FreeLance Open Source Software"} />
  </Layout>
);

export default IndexPage;
