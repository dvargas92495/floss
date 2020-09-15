import * as React from 'react'

import { Issue } from '../interfaces'

type ListDetailProps = {
  item: Issue
}

const ListDetail = ({ item: issue }: ListDetailProps) => (
  <div>
    <h1>Detail for {issue.link}</h1>
    <p>ID: {issue.uuid}</p>
  </div>
)

export default ListDetail
