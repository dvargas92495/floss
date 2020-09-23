import Layout from "../../components/Layout";
import List from "../../components/ContractList";
import Typography from "@material-ui/core/Typography";
import axios from "axios";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import React, { useEffect, useState, useCallback, useContext } from "react";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import TextField from "@material-ui/core/TextField";
import DialogActions from "@material-ui/core/DialogActions";
import addMonths from "date-fns/addMonths";
import format from "date-fns/format";
import Paper from "@material-ui/core/Paper";
import { API_URL } from "../../utils/client";
import { loadStripe } from "@stripe/stripe-js";
import isAfter from "date-fns/isAfter";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Switch from "@material-ui/core/Switch";
import UserContext from "../../components/UserContext";
import {
  CardElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";

const stripe = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || "");

const ContractList = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState("Loading...");
  useEffect(() => {
    axios
      .get(`${API_URL}/contracts`)
      .then((res) => {
        setItems(res.data);
        setLoading("");
      })
      .catch((e) => setLoading(e.response?.data || e.message));
  }, [setItems, setLoading]);
  return (
    <Paper variant={"outlined"}>
      {loading ? (
        <Typography variant={"body2"}>{loading}</Typography>
      ) : (
        <List items={items} />
      )}
    </Paper>
  );
};

const CreateGithubIssueForm = ({
  handleClose,
  setIntentClientSecret,
}: {
  handleClose: () => void;
  setIntentClientSecret: (secret: string) => void;
}) => {
  const { user } = useContext(UserContext);
  const [link, setLink] = useState("");
  const [linkError, setLinkError] = useState("");
  const [reward, setReward] = useState(100);
  const [payNow, setPayNow] = useState(true);
  const [rewardError, setRewardError] = useState("");
  const [dueDate, setDueDate] = useState(addMonths(new Date(), 1));
  const [dueDateError, setDueDateError] = useState("");
  const [error, setError] = useState("");
  const body = {
    link,
    reward,
    dueDate: format(dueDate, "yyyy-MM-dd"),
  };
  const axiosOpts = {
    headers: {
      Authorization: `token ${user?.accessToken}`,
    },
  };

  const saveIssue = useCallback(
    () =>
      reward > 0
        ? payNow
          ? axios
              .post(`${API_URL}/stripe-session`, body)
              .then((r) =>
                stripe.then(
                  (s) =>
                    s &&
                    s.redirectToCheckout({
                      sessionId: r.data.id as string,
                    })
                )
              )
              .catch((e) => setError(e.response?.data || e.message))
          : axios
              .post(`${API_URL}/stripe-setup-intent`, body, axiosOpts)
              .then((r) => setIntentClientSecret(r.data.client_secret))
              .catch((e) => setError(e.response?.data || e.message))
        : axios
            .post(`${API_URL}/contract`, body)
            .then(handleClose)
            .catch((e) => setError(e.response?.data || e.message)),
    [handleClose, body, payNow, setError, setIntentClientSecret]
  );

  const linkOnChange = useCallback(
    (e) => {
      setLinkError("");
      setLink(e.target.value);
    },
    [setLink, setLinkError]
  );

  const linkOnBlur = useCallback(() => {
    const replaceText = "https://github.com";
    if (!link.startsWith(replaceText)) {
      setLinkError(`Link must start with ${replaceText}`);
      return;
    }

    axios
      .get(link.replace(replaceText, "https://api.github.com/repos"))
      .then(
        (issue) =>
          issue.data.state !== "open" &&
          setLinkError(`Issue at ${link} is ${issue.data.state}`)
      )
      .catch((e) => setLinkError(e.response?.data?.message || e.message));
  }, [link, setLinkError]);

  const rewardOnChange = useCallback(
    (e) => {
      setReward(parseInt(e.target.value));
      setRewardError("");
    },
    [setReward, setRewardError]
  );

  const rewardOnBlur = useCallback(
    () => reward < 0 && setRewardError("Reward must be greater than 0"),
    [reward, setRewardError]
  );

  const dueDateOnChange = useCallback(
    (e) => {
      setDueDate(new Date(e.target.value));
      setDueDateError("");
    },
    [setDueDate, setDueDateError]
  );

  const dueDateOnBlur = useCallback(
    () =>
      !isAfter(dueDate, new Date()) &&
      setDueDateError("Due Date must be after today"),
    [dueDate, setDueDateError]
  );

  const payNowOnChange = useCallback((e) => setPayNow(e.target.checked), [
    setPayNow,
  ]);

  return (
    <>
      <DialogContent>
        <DialogContentText>
          To create a Github Issue Contract, please fill out the form below.
        </DialogContentText>
        <TextField
          autoFocus
          error={!!linkError}
          margin="dense"
          label="Github Issue Link"
          fullWidth
          required
          variant="filled"
          placeholder={"https://github.com/{owner}/{repo}/issues/{number}"}
          value={link}
          onChange={linkOnChange}
          helperText={linkError}
          onBlur={linkOnBlur}
        />
        <TextField
          type={"number"}
          error={!!rewardError}
          required
          variant="filled"
          label={"Reward"}
          placeholder={"100"}
          value={reward}
          onChange={rewardOnChange}
          onBlur={rewardOnBlur}
          helperText={rewardError}
        />
        <TextField
          type={"date"}
          required
          error={!!dueDateError}
          variant="filled"
          label={"Due"}
          value={format(dueDate, "yyyy-MM-dd")}
          onChange={dueDateOnChange}
          onBlur={dueDateOnBlur}
          helperText={dueDateError}
        />
        <FormControlLabel
          control={
            <Switch checked={payNow} onChange={payNowOnChange} name="payNow" />
          }
          label={payNow ? "Pay Now" : "Pay On Close"}
          labelPlacement={"bottom"}
        />
      </DialogContent>
      <DialogActions>
        <DialogContentText>{error}</DialogContentText>
        <Button onClick={handleClose} color="secondary">
          Cancel
        </Button>
        <Button
          onClick={saveIssue}
          color="primary"
          disabled={!!linkError || !link || !!rewardError || !!dueDateError}
        >
          Create
        </Button>
      </DialogActions>
    </>
  );
};

const StripeIntentForm = ({
  intentClientSecret,
  clearIntentClientSecret,
  handleClose,
}: {
  intentClientSecret: string;
  clearIntentClientSecret: () => void;
  handleClose: () => void;
}) => {
  const s = useStripe();
  const elements = useElements();
  const { user } = useContext(UserContext);
  const onSave = useCallback(() => {
    if (!s || !elements || !user) {
      return;
    }
    const card = elements.getElement(CardElement);
    if (!card) {
      return;
    }
    const { name, email } = user;
    s.confirmCardSetup(intentClientSecret, {
      payment_method: {
        card,
        billing_details: {
          name,
          email,
        },
      },
    }).then(handleClose);
  }, [s, intentClientSecret, elements, user]);
  return (
    <>
      <DialogContent>
        <DialogContentText>
          Card Details - To be charged when issue is closed
        </DialogContentText>
        <CardElement />
      </DialogContent>
      <DialogActions>
        <Button color="primary" onClick={clearIntentClientSecret}>
          Cancel
        </Button>
        <Button
          color="primary"
          onClick={onSave}
          disabled={!stripe || !elements || !user}
        >
          Save
        </Button>
      </DialogActions>
    </>
  );
};

const StripeIntent = ({
  intentClientSecret,
  clearIntentClientSecret,
  handleClose,
}: {
  intentClientSecret: string;
  clearIntentClientSecret: () => void;
  handleClose: () => void;
}) => (
  <Elements stripe={stripe}>
    <StripeIntentForm
      intentClientSecret={intentClientSecret}
      clearIntentClientSecret={clearIntentClientSecret}
      handleClose={handleClose}
    />
  </Elements>
);

const CreateGithubIssueDialog = () => {
  const [open, setOpen] = useState(false);
  const [intentClientSecret, setIntentClientSecret] = useState("");
  const handleOpen = useCallback(() => setOpen(true), [setOpen]);
  const handleClose = useCallback(() => setOpen(false), [setOpen]);
  const clearIntentClientSecret = useCallback(() => setIntentClientSecret(""), [
    setIntentClientSecret,
  ]);

  return (
    <>
      <Button color="secondary" variant="contained" onClick={handleOpen}>
        ADD ISSUE
      </Button>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="issue-form-title"
      >
        <DialogTitle id="issue-form-title">
          Create Github Issue Contract
        </DialogTitle>
        {intentClientSecret ? (
          <StripeIntent
            intentClientSecret={intentClientSecret}
            clearIntentClientSecret={clearIntentClientSecret}
            handleClose={handleClose}
          />
        ) : (
          <CreateGithubIssueForm
            handleClose={handleClose}
            setIntentClientSecret={setIntentClientSecret}
          />
        )}
      </Dialog>
    </>
  );
};

const WithStaticProps = () => {
  const [message, setMessage] = useState("");
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get("success")) {
      setMessage(
        "Contract created! You will receive an email confirmation and see your contract below."
      );
    }
    if (query.get("cancel")) {
      setMessage("Contract cancel");
    }
  }, [setMessage]);
  return (
    <Layout title="Contract List | Floss">
      <Typography variant="h1">Contract List</Typography>
      <Typography variant="subtitle1">{message}</Typography>
      <ContractList />
      <CreateGithubIssueDialog />
    </Layout>
  );
};

export default WithStaticProps;
