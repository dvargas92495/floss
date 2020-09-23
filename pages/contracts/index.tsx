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

type StripeSetupIntent = { id: string; client_secret: string };

const CreateGithubIssueForm = ({
  handleClose,
  setIntent,
  closeAndFetch,
}: {
  handleClose: () => void;
  setIntent: (intent: StripeSetupIntent) => void;
  closeAndFetch: () => void;
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
              .post(`${API_URL}/stripe-session`, body, axiosOpts)
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
              .then((r) => setIntent(r.data))
              .catch((e) => setError(e.response?.data || e.message))
        : axios
            .post(`${API_URL}/contract`, body)
            .then(closeAndFetch)
            .catch((e) => setError(e.response?.data || e.message)),
    [closeAndFetch, body, payNow, setError, setIntent]
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
    () =>
      (reward < 0 && setRewardError("Reward must be greater than 0")) ||
      (reward > 0 &&
        !user &&
        setRewardError("Must be signed in for a non zero reward")),
    [reward, setRewardError, user]
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
  intent,
  clearIntent,
  handleClose,
}: {
  intent: StripeSetupIntent;
  clearIntent: () => void;
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
    s.confirmCardSetup(intent.client_secret, {
      payment_method: {
        card,
        billing_details: {
          name,
          email,
        },
      },
    })
      .then(() => axios.put(`${API_URL}/contract`, { id: intent.id }))
      .then(handleClose);
  }, [s, intent, elements, user]);
  return (
    <>
      <DialogContent>
        <DialogContentText>
          Card Details - To be charged when issue is closed
        </DialogContentText>
        <CardElement />
      </DialogContent>
      <DialogActions>
        <Button color="primary" onClick={clearIntent}>
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
  intent,
  clearIntent,
  handleClose,
}: {
  intent: StripeSetupIntent;
  clearIntent: () => void;
  handleClose: () => void;
}) => (
  <Elements stripe={stripe}>
    <StripeIntentForm
      intent={intent}
      clearIntent={clearIntent}
      handleClose={handleClose}
    />
  </Elements>
);

const CreateGithubIssueDialog = ({
  fetchContracts,
}: {
  fetchContracts: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const [intent, setIntent] = useState<StripeSetupIntent>();
  const handleOpen = useCallback(() => setOpen(true), [setOpen]);
  const handleClose = useCallback(() => setOpen(false), [setOpen]);
  const clearIntent = useCallback(() => setIntent(undefined), [setIntent]);
  const closeAndFetch = useCallback(() => {
    handleClose();
    fetchContracts();
  }, [handleClose, fetchContracts]);

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
        {intent ? (
          <StripeIntent
            intent={intent}
            clearIntent={clearIntent}
            handleClose={closeAndFetch}
          />
        ) : (
          <CreateGithubIssueForm
            handleClose={handleClose}
            setIntent={setIntent}
            closeAndFetch={closeAndFetch}
          />
        )}
      </Dialog>
    </>
  );
};

const WithStaticProps = () => {
  const [message, setMessage] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState("Loading...");
  const fetchContracts = useCallback(() => {
    setLoading("Loading...");
    axios
      .get(`${API_URL}/contracts`)
      .then((res) => {
        setItems(res.data);
        setLoading("");
      })
      .catch((e) => setLoading(e.response?.data || e.message));
  }, [setItems, setLoading]);
  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);
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
      <Paper variant={"outlined"}>
        {loading ? (
          <Typography variant={"body2"}>{loading}</Typography>
        ) : (
          <List items={items} />
        )}
      </Paper>
      <CreateGithubIssueDialog fetchContracts={fetchContracts} />
    </Layout>
  );
};

export default WithStaticProps;
