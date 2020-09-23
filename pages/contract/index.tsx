import { Issue } from "../../interfaces";
import Layout from "../../components/Layout";
import React, { useEffect, useState } from "react";
import Typography from "@material-ui/core/Typography";
import { API_URL } from "../../utils/client";
import Link from "next/link";
import Button from "@material-ui/core/Button";

const StaticPropsDetail = () => {
  const [contract, setContract] = useState<Issue>();
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const uuid = query.get("uuid");
    fetch(`${API_URL}/contract?uuid=${uuid}`)
      .then((res) => res.json())
      .then((res) => setContract(res));
  }, [setContract]);
  return (
    <Layout title={`Contract Detail | Floss`}>
      {contract ? (
        <>
          <Typography variant={"h1"}>
            ${contract.reward} - {contract?.lifecycle?.toUpperCase()}
          </Typography>
          <Typography variant={"h5"}>{contract.link}</Typography>
          <Typography variant={"subtitle1"}>
            Due on: {contract.dueDate}
          </Typography>
        </>
      ) : (
        <Typography variant={"body2"}>Loading...</Typography>
      )}
      <Link href="/contracts">
        <Button color="secondary" variant="contained">
          VIEW CONTRACTS
        </Button>
      </Link>
    </Layout>
  );
};

export default StaticPropsDetail;
