import Typography from "@material-ui/core/Typography";
import React, { useContext, useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { API_URL } from "../../utils/client";
import axios from "axios";
import { useRouter } from "next/router";
import UserContext from "../../components/UserContext";

const AuthPage = () => {
  const [message, setMessage] = useState("");
  const router = useRouter();
  const { setUser } = useContext(UserContext);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const code = query.get("code");
    axios
      .post(`${API_URL}/github-auth`, {
        code,
      })
      .then((r) => {
        setUser(r.data);
        router.push("/");
      })
      .catch((e) => setMessage(e.response?.data || e.message));
  }, [setMessage, setUser]);
  return (
    <Layout title="Authentication | Floss">
      {message ? (
        <Typography variant="subtitle1">{message}</Typography>
      ) : (
        <Typography variant="h1">Logging In...</Typography>
      )}
    </Layout>
  );
};

export default AuthPage;
