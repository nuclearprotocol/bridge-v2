import { RenNetwork } from "@renproject/interfaces";
import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useDebounce } from "react-use";
import { useSelectedChainWallet } from "../../providers/multiwallet/multiwalletHooks";
import { mintChainClassMap } from "../../services/rentx";
import {
  BridgeCurrency,
  getChainConfig,
  getCurrencyConfig,
  toReleasedCurrency,
} from "../../utils/assetConfigs";
import { $renNetwork } from "../network/networkSlice";
import {
  $chain,
  addOrUpdateBalance,
  AssetBalance,
  resetBalances,
} from "./walletSlice";

export const isSupportedByCurrentNetwork = (
  currency: BridgeCurrency,
  renNetwork: RenNetwork
) => {
  const currencyConfig = getCurrencyConfig(currency);
  if (currencyConfig.networks) {
    return currencyConfig.networks.indexOf(renNetwork) > -1;
  }
  return true;
};

export const useFetchBalances = (currencySymbols: Array<BridgeCurrency>) => {
  const dispatch = useDispatch();
  const bridgeChain = useSelector($chain);
  const { walletConnected, provider, account } = useSelectedChainWallet();
  const renNetwork = useSelector($renNetwork);
  const bridgeChainConfig = getChainConfig(bridgeChain);
  const Chain = (mintChainClassMap as any)[bridgeChainConfig.rentxName];

  useEffect(() => {
    if (!walletConnected) {
      dispatch(resetBalances());
    }
  }, [dispatch, walletConnected]);

  const fetchAssetBalance = useCallback(
    (currency: BridgeCurrency) => {
      if (
        provider &&
        account &&
        walletConnected &&
        isSupportedByCurrentNetwork(currency, renNetwork)
      ) {
        const chain = Chain(provider, renNetwork);
        return chain
          .getBalance(currency, account)
          .then((balance: any) => {
            return balance.toNumber() / 100000000;
          })
          .catch(console.error);
      } else {
        return Promise.resolve(null);
      }
    },
    [Chain, account, renNetwork, provider, walletConnected]
  );

  useDebounce(
    () => {
      if (!walletConnected) {
        return;
      }
      for (const currencySymbol of currencySymbols) {
        const sourceCurrencySymbol = toReleasedCurrency(currencySymbol);
        fetchAssetBalance(sourceCurrencySymbol).then((balance: any) => {
          if (balance === null) {
            return;
          }
          dispatch(
            addOrUpdateBalance({
              symbol: currencySymbol,
              balance,
            })
          );
        });
      }
    },
    1000,
    [dispatch, fetchAssetBalance, walletConnected]
  );
};

export const getAssetBalance = (
  balances: Array<AssetBalance>,
  symbol: BridgeCurrency
) => {
  const balanceEntry = balances.find((entry) => entry.symbol === symbol);
  return balanceEntry?.balance;
};