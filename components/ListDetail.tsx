import * as React from 'react'

import { Issue } from '../interfaces'

type ListDetailProps = {
  item: Issue
}

const ListDetail = ({ item: issue }: ListDetailProps) => (
  <div>
    <h1>Detail for {issue.repository}/{issue.issue}</h1>
    <p>ID: {issue.id}</p>
  </div>
)

export default ListDetail
