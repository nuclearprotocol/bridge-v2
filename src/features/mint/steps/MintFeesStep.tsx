import {
  Checkbox,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  IconButton,
  Typography,
} from "@material-ui/core";
import React, {
  FunctionComponent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import {
  ActionButton,
  ActionButtonWrapper,
} from "../../../components/buttons/Buttons";
import { NumberFormatText } from "../../../components/formatting/NumberFormatText";
import { BackArrowIcon } from "../../../components/icons/RenIcons";
import { CheckboxWrapper } from "../../../components/inputs/InputHelpers";
import {
  PaperActions,
  PaperContent,
  PaperHeader,
  PaperNav,
  PaperTitle,
} from "../../../components/layout/Paper";
import { CenteredProgress } from "../../../components/progress/ProgressHelpers";
import { TooltipWithIcon } from "../../../components/tooltips/TooltipWithIcon";
import {
  AssetInfo,
  BigAssetAmount,
  BigAssetAmountWrapper,
  LabelWithValue,
  MiddleEllipsisText,
  SpacedDivider,
} from "../../../components/typography/TypographyHelpers";
import { Debug } from "../../../components/utils/Debug";
import { WalletStatus } from "../../../components/utils/types";
import { paths } from "../../../pages/routes";
import { db } from "../../../services/database/database";
import {
  getChainConfig,
  getCurrencyConfig,
  toMintedCurrency,
} from "../../../utils/assetConfigs";
import { useFetchFees } from "../../fees/feesHooks";
import { getTransactionFees } from "../../fees/feesUtils";
import { $exchangeRates } from "../../marketData/marketDataSlice";
import { findExchangeRate } from "../../marketData/marketDataUtils";
import { $renNetwork } from "../../network/networkSlice";
import { TransactionFees } from "../../transactions/components/TransactionFees";
import {
  $currentSessionCount,
  addTransaction,
  setCurrentTxId,
} from "../../transactions/transactionsSlice";
import {
  createTxQueryString,
  LocationTxState,
  TxConfigurationStepProps,
  TxType,
} from "../../transactions/transactionsUtils";
import { useShakePaper } from "../../ui/uiHooks";
import {
  useAuthRequired,
  useSelectedChainWallet,
} from "../../wallet/walletHooks";
import { $wallet, setWalletPickerOpened } from "../../wallet/walletSlice";
import {
  getMintDynamicTooltips,
  mintTooltips,
} from "../components/MintHelpers";
import { $mint } from "../mintSlice";
import {
  createMintTransaction,
  preValidateMintTransaction,
} from "../mintUtils";

export const MintFeesStep: FunctionComponent<TxConfigurationStepProps> = ({
  onPrev,
}) => {
  useAuthRequired(true);
  const dispatch = useDispatch();
  const history = useHistory();
  const { status, walletConnected, account } = useSelectedChainWallet();
  const [mintingInitialized, setMintingInitialized] = useState(false);
  const { amount, currency } = useSelector($mint);
  const {
    chain,
    signatures: { signature },
  } = useSelector($wallet);
  const network = useSelector($renNetwork);
  const currentSessionCount = useSelector($currentSessionCount);
  const exchangeRates = useSelector($exchangeRates);
  const { fees, pending } = useFetchFees(currency, TxType.MINT);
  const currencyUsdRate = findExchangeRate(exchangeRates, currency);

  const amountUsd = amount * currencyUsdRate;
  const { conversionTotal } = getTransactionFees({
    amount,
    fees,
    type: TxType.MINT,
  });

  const lockCurrencyConfig = getCurrencyConfig(currency);
  const { GreyIcon } = lockCurrencyConfig;

  const targetCurrencyAmountUsd = conversionTotal * currencyUsdRate;
  const destinationChainConfig = getChainConfig(chain);
  const destinationChainNativeCurrencyConfig = getCurrencyConfig(
    destinationChainConfig.nativeCurrency
  );
  const mintDynamicTooltips = getMintDynamicTooltips(
    destinationChainConfig,
    destinationChainNativeCurrencyConfig
  );
  const mintedCurrency = toMintedCurrency(currency);

  const mintedCurrencyConfig = getCurrencyConfig(mintedCurrency);

  const [ackChecked, setAckChecked] = useState(false);
  const [touched, setTouched] = useState(false);
  const showAckError = !ackChecked && touched;
  const handleAckCheckboxChange = useCallback((event) => {
    setTouched(true);
    setAckChecked(event.target.checked);
  }, []);
  useShakePaper(showAckError);

  const tx = useMemo(
    () =>
      createMintTransaction({
        amount: amount,
        currency: currency,
        destAddress: account,
        mintedCurrency: toMintedCurrency(currency),
        mintedCurrencyChain: chain,
        userAddress: account,
        network: network,
        dayIndex: currentSessionCount,
      }),
    [amount, currency, account, chain, network, currentSessionCount]
  );
  const txValid = preValidateMintTransaction(tx);
  const canInitializeMinting = ackChecked && txValid;

  const handleConfirm = useCallback(() => {
    if (status === WalletStatus.CONNECTED) {
      setTouched(true);
      if (canInitializeMinting) {
        setMintingInitialized(true);
      } else {
        setMintingInitialized(false);
      }
    } else {
      setTouched(false);
      setMintingInitialized(false);
      dispatch(setWalletPickerOpened(true));
    }
  }, [dispatch, status, canInitializeMinting]);

  const onMintTxCreated = useCallback(
    async (tx) => {
      const dbTx = { ...tx };
      await db.addTx(dbTx, account, signature);

      dispatch(setCurrentTxId(tx.id));
      dispatch(addTransaction(tx));
      history.push({
        pathname: paths.MINT_TRANSACTION,
        search: "?" + createTxQueryString(tx),
        state: {
          txState: { newTx: true },
        } as LocationTxState,
      });
    },
    [dispatch, history, account, signature]
  );

  // there is a dependency loop, because we depend on the number
  // of txes to determine the dayIndex, which updates when we create
  // a new tx, leading to multiple txes being created for the same
  // parameters.
  // This flag prevents that
  const [creatingMintTx, setCreatingMintTx] = useState(false);

  useEffect(() => {
    if (mintingInitialized && !creatingMintTx) {
      setCreatingMintTx(true);
      onMintTxCreated(tx).finally();
    }
  }, [onMintTxCreated, mintingInitialized, tx, creatingMintTx]);

  return (
    <>
      <PaperHeader>
        <PaperNav>
          <IconButton onClick={onPrev}>
            <BackArrowIcon />
          </IconButton>
        </PaperNav>
        <PaperTitle>Fees & Confirm</PaperTitle>
        <PaperActions />
      </PaperHeader>
      <PaperContent bottomPadding>
        <BigAssetAmountWrapper>
          <BigAssetAmount
            value={<NumberFormatText value={amount} spacedSuffix={currency} />}
          />
        </BigAssetAmountWrapper>
        <Typography variant="body1" gutterBottom>
          Details
        </Typography>
        <LabelWithValue
          label="Sending"
          labelTooltip={mintTooltips.sending}
          value={<NumberFormatText value={amount} spacedSuffix={currency} />}
          valueEquivalent={
            <NumberFormatText
              value={amountUsd}
              spacedSuffix="USD"
              decimalScale={2}
              fixedDecimalScale
            />
          }
        />
        <LabelWithValue
          label="To"
          labelTooltip={mintTooltips.to}
          value={destinationChainConfig.full}
        />
        <LabelWithValue
          label="Recipient Address"
          labelTooltip={mintTooltips.recipientAddress}
          value={
            <MiddleEllipsisText hoverable>{tx.userAddress}</MiddleEllipsisText>
          }
        />
        <SpacedDivider />
        <Typography variant="body1" gutterBottom>
          Fees
        </Typography>
        <TransactionFees
          chain={chain}
          amount={amount}
          currency={currency}
          type={TxType.MINT}
        />
      </PaperContent>
      <Divider />
      <PaperContent darker topPadding bottomPadding>
        {walletConnected &&
          (pending ? (
            <CenteredProgress />
          ) : (
            <AssetInfo
              label="Receiving"
              value={
                <NumberFormatText
                  value={conversionTotal}
                  spacedSuffix={mintedCurrencyConfig.short}
                />
              }
              valueEquivalent={
                <NumberFormatText
                  prefix=" = $"
                  value={targetCurrencyAmountUsd}
                  spacedSuffix="USD"
                  decimalScale={2}
                  fixedDecimalScale
                />
              }
              Icon={<GreyIcon fontSize="inherit" />}
            />
          ))}
        <CheckboxWrapper>
          <FormControl error={showAckError}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={ackChecked}
                  onChange={handleAckCheckboxChange}
                  name="ack"
                  color="primary"
                />
              }
              label={
                <FormLabel htmlFor="ack" component={Typography}>
                  <Typography
                    variant="caption"
                    color={showAckError ? "inherit" : "textPrimary"}
                  >
                    I acknowledge this transaction requires{" "}
                    {destinationChainNativeCurrencyConfig.short}{" "}
                    <TooltipWithIcon title={mintDynamicTooltips.acknowledge} />
                  </Typography>
                </FormLabel>
              }
            />
          </FormControl>
        </CheckboxWrapper>
        <ActionButtonWrapper>
          <ActionButton
            onClick={handleConfirm}
            disabled={!ackChecked || mintingInitialized || !walletConnected}
          >
            {!walletConnected
              ? "Connect Wallet"
              : mintingInitialized
              ? "Confirming..."
              : "Confirm"}
          </ActionButton>
        </ActionButtonWrapper>
      </PaperContent>
      <Debug it={{ tx }} />
    </>
  );
};
