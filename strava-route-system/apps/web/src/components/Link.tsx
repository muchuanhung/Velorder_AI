import React from "react";
import Link from "next/link";

type LinkComponentProps = Omit<React.ComponentProps<typeof Link>, "href"> & {
  href: string;
};

const LinkComponent = ({
  href = "#",
  children,
  ...props
}: LinkComponentProps) => {
  return (
    <Link href={href} {...props} suppressHydrationWarning>
      {children}
    </Link>
  );
};

export default React.memo(LinkComponent);
