import { Contract } from "../../interfaces";
import Layout from "../../components/Layout";
import React, { useEffect, useState } from "react";
import Typography from "@material-ui/core/Typography";
import { API_URL } from "../../utils/client";
import { useRouter } from "next/router";

const StaticPropsDetail = () => {
  const router = useRouter();

  const { id } = router.query;
  const [contract, setContract] = useState<Contract>();
  useEffect(() => {
    fetch(`${API_URL}/contract?uuid=${id}`)
      .then((res) => res.json())
      .then((res) => setContract(res));
  }, [setContract, id]);
  return (
    <Layout title={`Contract Detail | Floss`}>
      {contract ? (
        <>
          <Typography variant={"h1"}>
            ${contract.reward} - {contract?.lifecycle?.toUpperCase()}
          </Typography>
          <Typography variant={"h5"}>
            {contract.link}
          </Typography>
          <Typography variant={"subtitle1"}>
            Due on: {contract.dueDate}
          </Typography>
        </>
      ) : (
        <Typography variant={"body2"}>Loading...</Typography>
      )}
    </Layout>
  );
};

export default StaticPropsDetail;
