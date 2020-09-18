import Layout from "../../components/Layout";
import List from "../../components/ContractList";
import Typography from "@material-ui/core/Typography";
import axios from "axios";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import React, { useEffect, useState, useCallback } from "react";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import TextField from "@material-ui/core/TextField";
import DialogActions from "@material-ui/core/DialogActions";
import addMonths from "date-fns/addMonths";
import format from "date-fns/format";
import Paper from "@material-ui/core/Paper";
import { API_URL } from "../../utils/client";

const ContractList = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(`${API_URL}/contracts`)
      .then((res) => res.json())
      .then((res) => setItems(res))
      .finally(() => setLoading(false));
  }, [setItems, setLoading]);
  return (
    <Paper variant={"outlined"}>
      {loading ? (
        <Typography variant={"body2"}>Loading...</Typography>
      ) : (
        <List items={items} />
      )}
    </Paper>
  );
};

const CreateGithubIssueForm = ({
  handleClose,
}: {
  handleClose: () => void;
}) => {
  const [link, setLink] = useState("");
  const [reward, setReward] = useState(100);
  const [dueDate, setDueDate] = useState(addMonths(new Date(), 1));
  const [error, setError] = useState("");
  const saveIssue = useCallback(
    () =>
      axios
        .post(`${API_URL}/contract`, {
          link,
          reward,
          dueDate: format(dueDate, "yyyy-MM-dd"),
        })
        .then(handleClose)
        .catch((e) => {
          console.log(e)
          setError(e.message)
        }),
    [handleClose, link, reward, dueDate, setError]
  );

  return (
    <>
      <DialogContent>
        <DialogContentText>
          To create a Github Issue Contract, please fill out the form below.
        </DialogContentText>
        <TextField
          autoFocus
          margin="dense"
          label="Github Issue Link"
          fullWidth
          required
          variant="filled"
          placeholder={"https://github.com/{owner}/{repo}/issues/{number}"}
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />
        <TextField
          type={"number"}
          required
          variant="filled"
          label={"Reward"}
          placeholder={"100"}
          value={reward}
          onChange={(e) => setReward(parseInt(e.target.value))}
        />
        <TextField
          type={"date"}
          required
          variant="filled"
          label={"Due"}
          value={format(dueDate, "yyyy-MM-dd")}
          onChange={(e) => setDueDate(new Date(e.target.value))}
        />
      </DialogContent>
      <DialogActions>
        <DialogContentText>{error}</DialogContentText>
        <Button onClick={handleClose} color="secondary">
          Cancel
        </Button>
        <Button onClick={saveIssue} color="primary">
          Create
        </Button>
      </DialogActions>
    </>
  );
};

const CreateGithubIssueDialog = () => {
  const [open, setOpen] = useState(false);
  const handleOpen = useCallback(() => setOpen(true), [setOpen]);
  const handleClose = useCallback(() => setOpen(false), [setOpen]);

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
        <CreateGithubIssueForm handleClose={handleClose} />
      </Dialog>
    </>
  );
};

const WithStaticProps = () => (
  <Layout title="Contract List | Floss">
    <Typography variant="h1">Contract List</Typography>
    <ContractList />
    <CreateGithubIssueDialog />
  </Layout>
);

export default WithStaticProps;
