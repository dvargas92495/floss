import React from "react";
import Link from "next/link";

import { Issue } from "../interfaces";

type Props = {
  data: Issue;
};

const ListItem = ({ data }: Props) => (
  <>
    <Link href="/issues/[id]" as={`/issues/${data.id}`}>
      <a>
        {data.repository}/issues/{data.issue}
      </a>
    </Link>
    : {data.reward}
  </>
);

export default ListItem;
