import * as React from 'react'
import ListItem from './ListItem'
import { Issue } from '../interfaces'

type Props = {
  items: Issue[]
}

const List = ({ items }: Props) => (
  <ul>
    {items.map((item) => (
      <li key={item.uuid}>
        <ListItem data={item} />
      </li>
    ))}
  </ul>
)

export default List
