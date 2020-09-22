import Typography from "@material-ui/core/Typography";
import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { API_URL } from "../../utils/client";
import axios from "axios";

const AuthPage = () => {
  const [message, setMessage] = useState("");
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const code = query.get("code");
    axios.post(`${API_URL}/github-auth`, {
      code,
    }).then(r => setMessage(r.data.access_token));
  }, [setMessage]);
  return (
    <Layout title="Authentication | Floss">
      <Typography variant="h1">Logging In...</Typography>
      <Typography variant="subtitle1">{message}</Typography>
    </Layout>
  );
};

export default AuthPage;
