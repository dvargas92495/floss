import * as React from "react";
import { H3, H4, NavList, Outlined } from "@dvargas92495/ui";

const EntityList = ({
  items,
  title,
}: {
  title: string;
  items: {
    id?: string;
    link?: string;
    icon: string;
    primary: string;
    secondary: string;
    tertiary: string;
  }[];
}) => (
  <>
    <H3>{title}</H3>
    <Outlined>
      {items.length === 0 ? (
        <H4>No Active {title}</H4>
      ) : (
        <NavList
          label={title}
          items={items.map((item) => ({
            href: item.id
              ? `/${title.toLowerCase().substring(0, title.length - 1)}?id=${
                  item.id
                }`
              : item.link || "",
            icon: item.icon,
            primary: item.primary,
            secondary: (
              <>
                {item.secondary}
                <br />
                {item.tertiary}
              </>
            ),
          }))}
        />
      )}
    </Outlined>
  </>
);

export default EntityList;
