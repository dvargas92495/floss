import React, { useCallback, useContext } from "react";
import Layout from "../../components/Layout";
import { API_URL } from "../../utils/client";
import axios from "axios";
import { useRouter } from "next/router";
import UserContext from "../../components/UserContext";
import { DataLoader } from "@dvargas92495/ui";

const AuthPage = () => {
  const router = useRouter();
  const { setUser } = useContext(UserContext);
  const auth = useCallback(() => {
    const query = new URLSearchParams(window.location.search);
    const isTwitter = query.get("twitter");
    if (isTwitter) {
      const oauth_token = query.get("oauth_token");
      const oauth_verifier = query.get("oauth_verifier");
      if (oauth_token && oauth_verifier) {
        return axios
          .post(`${API_URL}/twitter-auth`, {
            oauth_token,
            oauth_verifier,
          })
          .then((r) => console.log(r.data));
      } else {
        return Promise.reject({ message: "Missing Twitter Token" });
      }
    }

    const code = query.get("code");
    return axios
      .post(`${API_URL}/github-auth`, {
        code,
      })
      .then((r) => {
        setUser(r.data);
        localStorage.setItem("githubToken", r.data.accessToken);
        router.push("/");
      });
  }, [setUser]);
  return (
    <Layout title="Authentication | Floss">
      <DataLoader loadAsync={auth} />
    </Layout>
  );
};

export default AuthPage;
