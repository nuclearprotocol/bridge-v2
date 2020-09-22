import {
  Box,
  Button,
  FormControlLabel,
  Switch,
  Tab,
  Tabs,
  Typography,
  ThemeProvider,
  CssBaseline,
} from "@material-ui/core";
import { Alert } from "@material-ui/lab";
import React, { FunctionComponent, useCallback } from "react";
import { darkTheme, lightTheme } from "../../theme/theme";
import { BridgePaper } from "../layout/BridgePaper";
import { Tooltip } from "../tooltips/Tooltip";
import { Debug } from "../utils/Debug";
import {
  Cartesian,
  RandomText,
  SectionHeader,
  Wrapper,
} from "./PresentationHelpers";

export const Catalog: FunctionComponent = () => {
  const [tab, setTab] = React.useState(0);
  const [theme, setTheme] = React.useState("light");
  const handleTabChange = useCallback((event, newValue) => {
    setTab(newValue);
  }, []);
  const handleThemeChange = useCallback(() => {
    setTheme(theme === "light" ? "dark" : "light");
  }, [theme]);
  const selectedTheme = theme === "light" ? lightTheme : darkTheme;
  return (
    <ThemeProvider theme={selectedTheme}>
      <CssBaseline />
      <div>
        <Box display="flex">
          <Typography variant="h5">Component Catalog</Typography>
          <FormControlLabel
            control={
              <Switch
                checked={theme === "dark"}
                onChange={handleThemeChange}
                name="theme"
                color="primary"
              />
            }
            label="Dark mode (very beta)"
          />
        </Box>
        <SectionHeader>Buttons</SectionHeader>
        <Wrapper>
          <Button variant="contained" color="primary" size="large">
            Primary Button
          </Button>
          <Button variant="contained" color="secondary" size="large">
            Secondary Button
          </Button>
        </Wrapper>
        <Cartesian
          Component={Button}
          Wrapper={Wrapper}
          content={(props: any) => `${props.color}`}
          propVariants={{
            variant: ["contained"],
            size: ["large"],
            color: ["primary", "secondary"],
            disabled: [true, false],
          }}
        />
        <SectionHeader>Paper</SectionHeader>
        <BridgePaper>
          <Tabs
            value={tab}
            onChange={handleTabChange}
            indicatorColor="primary"
            variant="fullWidth"
          >
            <Tab label="Mint" />
            <Tab label="Release" />
          </Tabs>
          <Typography variant="body1">Application Main Container</Typography>
          <Box height={200} />
          <Button variant="contained" color="primary" size="large" fullWidth>
            Next
          </Button>
        </BridgePaper>
        <SectionHeader>Alerts</SectionHeader>
        <Cartesian
          Component={Alert}
          Wrapper={Wrapper}
          propVariants={{
            onClose: [() => {}],
            severity: ["error", "warning", "info", "success"],
          }}
        >
          <span>
            <RandomText /> <a href="/">a link</a>
          </span>
        </Cartesian>
        <SectionHeader>Typography</SectionHeader>
        <Cartesian
          Component={Typography}
          content={({ variant }) => variant}
          propVariants={{
            variant: [
              "h1",
              "h2",
              "h3",
              "h4",
              "h5",
              "h6",
              "subtitle1",
              "subtitle2",
              "body1",
              "body2",
              "button",
              "caption",
              "overline",
            ],
          }}
        />
        <SectionHeader>Tooltips</SectionHeader>
        <Typography variant="body1">
          This is a text with a <Tooltip title="And appears here"><span>tooltip</span></Tooltip> on hover.
        </Typography>
        <SectionHeader>Theme configuration:</SectionHeader>
        <Debug force it={selectedTheme} />
      </div>
    </ThemeProvider>
  );
};
