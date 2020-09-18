import { makeStyles } from "@material-ui/core/styles";
import React, { FunctionComponent } from "react";
import classNames from "classnames";

const PADDING = 20;
const useStyles = makeStyles({
  root: {
    paddingLeft: PADDING,
    paddingRight: PADDING,
    paddingBottom: PADDING,
  },
  top: {
    paddingTop: PADDING,
  },
});

export type PaperContentProps = {
  topPadding?: boolean;
  bottomPadding?: boolean;
};

export const PaperContent: FunctionComponent<PaperContentProps> = ({
  topPadding,
  bottomPadding,
  children,
}) => {
  const styles = useStyles();
  const className = classNames(styles.root, {
    [styles.top]: topPadding,
  });
  return <div className={className}>{children}</div>;
};
