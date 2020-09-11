import Layout from "../../components/Layout";
import List from "../../components/List";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import { GetStaticProps } from "next";
import { useEffect, useState, useCallback } from "react";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import TextField from "@material-ui/core/TextField";
import DialogActions from "@material-ui/core/DialogActions";

const IssueList = () => {
  const [items, setItems] = useState([]);
  useEffect(() => {
    fetch(
      `https://${process.env.NEXT_PUBLIC_REST_API_ID}.execute-api.us-east-1.amazonaws.com/production/github-issues`
    )
      .then((res) => res.json())
      .then((res) => {
        setItems(
          res.map((item: any) => ({
            repository: item.repository.full_name,
            id: item.id,
            issue: item.number,
            reward: 0,
          }))
        );
      });
  }, [setItems]);
  return <List items={items} />;
};
const WithStaticProps = () => {
  const [open, setOpen] = useState(false);
  const handleOpen = useCallback(() => setOpen(true), [setOpen]);
  const handleClose = useCallback(() => setOpen(false), [setOpen]);
  return (
    <Layout title="Issues List | Floss">
      <Typography variant="h1">Issues List</Typography>
      <IssueList />
      <Button color="secondary" variant="contained" onClick={handleOpen}>
        ADD ISSUE
      </Button>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="issue-form-title"
      >
        <DialogTitle id="issue-form-title">Create Github Issue Contract</DialogTitle>
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
          />
          <TextField
            type={"number"}
            required
            variant="filled"
            label={"Reward"}
          />
          <TextField type={"date"} required variant="filled" label={"Due"} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleClose} color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps = async () => {
  return {
    props: { items: [] },
  };
};

export default WithStaticProps;
