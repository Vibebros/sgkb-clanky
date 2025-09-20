"use client";

import { Bell, CreditCard, Lock, ShieldCheck, Wallet } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type GraphQLTransaction = {
  accountName?: string | null;
  textCreditor?: string | null;
  textShortCreditor?: string | null;
  amount?: number | string | null;
  valDate?: string | null;
  direction?: number | string | null;
};

type BankTransaction = {
  accountName: string;
  textCreditor: string;
  amount: number;
  valDate: string;
  direction: number;
};

const SETTINGS_QUERY = `
  query Settings {
    bankTransactions {
      accountName
      textCreditor
      textShortCreditor
      amount
      valDate
      direction
    }
  }
`;

const STORAGE_KEY = "sgkb-settings-preferences";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "CHF",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

type ToggleSwitchProps = {
  enabled: boolean;
  onChange: (value: boolean) => void;
  label: string;
};

function ToggleSwitch({ enabled, onChange, label }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${enabled ? "bg-green-600" : "bg-gray-300"}`}
      aria-pressed={enabled}
      aria-label={label}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${enabled ? "translate-x-5" : "translate-x-1"}`}
      />
    </button>
  );
}

type StoredPreferences = {
  accountNotifications?: Record<string, boolean>;
  merchantWatchlist?: Record<string, boolean>;
  dailyLimits?: Record<string, number>;
  preferredAccount?: string;
  securitySettings?: SecuritySettings;
};

type SecuritySettings = {
  biometricLogin: boolean;
  twoFactor: boolean;
  cardFreezing: boolean;
  locationAlerts: boolean;
};

type AccountSummary = {
  accountName: string;
  inflow: number;
  outflow: number;
  transactionCount: number;
  lastDate: string | null;
};

export default function SettingsPage() {
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [accountNotifications, setAccountNotifications] = useState<
    Record<string, boolean>
  >({});
  const [merchantWatchlist, setMerchantWatchlist] = useState<
    Record<string, boolean>
  >({});
  const [dailyLimits, setDailyLimits] = useState<Record<string, number>>({});
  const [preferredAccount, setPreferredAccount] = useState<string>("");
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    biometricLogin: true,
    twoFactor: false,
    cardFreezing: false,
    locationAlerts: true,
  });
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: StoredPreferences = JSON.parse(stored);
        setAccountNotifications(parsed.accountNotifications ?? {});
        setMerchantWatchlist(parsed.merchantWatchlist ?? {});
        setDailyLimits(parsed.dailyLimits ?? {});
        setPreferredAccount(parsed.preferredAccount ?? "");
        setSecuritySettings((prev) => ({
          ...prev,
          ...(parsed.securitySettings ?? {}),
        }));
      }
    } catch (storageError) {
      console.error("Failed to read stored settings", storageError);
    }
  }, []);

  useEffect(() => {
    const fetchSettingsData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("http://127.0.0.1:8000/graphql/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: SETTINGS_QUERY,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to load settings data");
        }

        const result = await response.json();

        if (result.errors?.length) {
          throw new Error(
            result.errors[0]?.message ?? "Unexpected GraphQL error",
          );
        }

        const rawTransactions = Array.isArray(result.data?.bankTransactions)
          ? result.data.bankTransactions
          : [];

        const normalizedTransactions: BankTransaction[] = rawTransactions
          .map((item: GraphQLTransaction) => ({
            accountName: item?.accountName?.trim() || "—",
            textCreditor:
              item?.textCreditor?.trim() ||
              item?.textShortCreditor?.trim() ||
              "—",
            amount:
              typeof item?.amount === "number"
                ? item.amount
                : parseFloat(item?.amount ?? "0"),
            valDate: item?.valDate ?? "",
            direction:
              typeof item?.direction === "number"
                ? item.direction
                : Number(item?.direction ?? 0),
          }))
          .filter(
            (transaction) =>
              transaction.valDate && Number.isFinite(transaction.amount),
          );

        setTransactions(normalizedTransactions);
      } catch (fetchError) {
        setError(
          fetchError instanceof Error ? fetchError.message : "Unknown error",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSettingsData();
  }, []);

  useEffect(() => {
    if (loading) return;
    try {
      const payload: StoredPreferences = {
        accountNotifications,
        merchantWatchlist,
        dailyLimits,
        preferredAccount,
        securitySettings,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (storageError) {
      console.error("Failed to persist settings", storageError);
    }
  }, [
    accountNotifications,
    dailyLimits,
    loading,
    merchantWatchlist,
    preferredAccount,
    securitySettings,
  ]);

  const accounts = useMemo(() => {
    const unique = new Set<string>();
    transactions.forEach((transaction) => {
      if (transaction.accountName !== "—") {
        unique.add(transaction.accountName);
      }
    });
    return Array.from(unique).sort();
  }, [transactions]);

  const accountSummaries = useMemo(() => {
    const summaryMap = new Map<string, AccountSummary>();

    transactions.forEach((transaction) => {
      const summary = summaryMap.get(transaction.accountName) ?? {
        accountName: transaction.accountName,
        inflow: 0,
        outflow: 0,
        transactionCount: 0,
        lastDate: null,
      };

      if (transaction.direction === 1) {
        summary.inflow += Math.abs(transaction.amount);
      } else if (transaction.direction === 2) {
        summary.outflow += Math.abs(transaction.amount);
      }

      summary.transactionCount += 1;

      const currentDate = transaction.valDate;
      if (
        !summary.lastDate ||
        new Date(currentDate) > new Date(summary.lastDate)
      ) {
        summary.lastDate = currentDate;
      }

      summaryMap.set(transaction.accountName, summary);
    });

    return Array.from(summaryMap.values()).sort(
      (a, b) => b.outflow - a.outflow,
    );
  }, [transactions]);

  const latestActivity = useMemo(() => {
    if (!transactions.length) return null;
    const mostRecent = transactions.reduce((latest, transaction) => {
      const transactionTime = new Date(transaction.valDate).getTime();
      return transactionTime > latest ? transactionTime : latest;
    }, 0);

    return new Date(mostRecent);
  }, [transactions]);

  const topMerchants = useMemo(() => {
    const totals = new Map<string, number>();

    transactions.forEach((transaction) => {
      if (transaction.direction !== 2) return;
      const key = transaction.textCreditor || "—";
      totals.set(key, (totals.get(key) ?? 0) + Math.abs(transaction.amount));
    });

    return Array.from(totals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [transactions]);

  useEffect(() => {
    if (!accounts.length) return;

    setAccountNotifications((prev) => {
      if (Object.keys(prev).length) return prev;
      const defaults: Record<string, boolean> = {};
      accounts.forEach((account, index) => {
        defaults[account] = index < 3;
      });
      return defaults;
    });

    setPreferredAccount((prev) => prev || accounts[0] || "");
  }, [accounts]);

  useEffect(() => {
    if (!topMerchants.length) return;

    setMerchantWatchlist((prev) => {
      if (Object.keys(prev).length) return prev;
      const defaults: Record<string, boolean> = {};
      topMerchants.forEach(([merchant], index) => {
        defaults[merchant] = index < 2;
      });
      return defaults;
    });
  }, [topMerchants]);

  useEffect(() => {
    if (!accountSummaries.length) return;

    setDailyLimits((prev) => {
      if (Object.keys(prev).length) return prev;
      const defaults: Record<string, number> = {};
      accountSummaries.forEach((summary) => {
        const baseline = summary.outflow > 0 ? summary.outflow * 0.2 : 200;
        defaults[summary.accountName] = Math.round(baseline);
      });
      return defaults;
    });
  }, [accountSummaries]);

  const notificationCount = useMemo(
    () => Object.values(accountNotifications).filter(Boolean).length,
    [accountNotifications],
  );

  const watchlistCount = useMemo(
    () => Object.values(merchantWatchlist).filter(Boolean).length,
    [merchantWatchlist],
  );

  const totalAccounts = accounts.length;

  const highestOutflowAccount = accountSummaries[0];

  const toggleAccountNotification = (account: string) => {
    setAccountNotifications((prev) => ({
      ...prev,
      [account]: !prev[account],
    }));
  };

  const toggleMerchant = (merchant: string) => {
    setMerchantWatchlist((prev) => ({
      ...prev,
      [merchant]: !prev[merchant],
    }));
  };

  const updateDailyLimit = (account: string, value: number) => {
    setDailyLimits((prev) => ({
      ...prev,
      [account]: value,
    }));
  };

  const toggleSecurity = (key: keyof SecuritySettings) => {
    setSecuritySettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = () => {
    setFeedback("Preferences saved successfully.");
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div className="px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure alerts, security preferences, and control how Clanky
          monitors your accounts.
        </p>
      </div>

      {loading && <div className="text-gray-600">Loading settings…</div>}
      {error && !loading && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Tracked accounts</p>
                <div className="rounded-full bg-green-100 p-2 text-green-700">
                  <Wallet className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-semibold text-gray-900">
                {notificationCount}/{totalAccounts}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Notifications currently enabled
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Merchant watchlist</p>
                <div className="rounded-full bg-blue-100 p-2 text-blue-700">
                  <Bell className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-semibold text-gray-900">
                {watchlistCount}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Merchants flagged for alerts
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Highest outflow</p>
                <div className="rounded-full bg-amber-100 p-2 text-amber-600">
                  <CreditCard className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-semibold text-gray-900">
                {highestOutflowAccount
                  ? formatCurrency(highestOutflowAccount.outflow)
                  : "—"}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {highestOutflowAccount
                  ? highestOutflowAccount.accountName
                  : "No transactions"}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Latest activity</p>
                <div className="rounded-full bg-purple-100 p-2 text-purple-700">
                  <ShieldCheck className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-semibold text-gray-900">
                {latestActivity
                  ? formatDate(latestActivity.toISOString())
                  : "—"}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Most recent transaction
              </p>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Account notifications
                </h2>
                <span className="text-xs text-gray-400">Real-time alerts</span>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Enable notifications for the accounts you want Clanky to
                prioritise.
              </p>
              <div className="mt-4 space-y-4">
                {accounts.map((account) => {
                  const summary = accountSummaries.find(
                    (item) => item.accountName === account,
                  );
                  return (
                    <div
                      key={account}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{account}</p>
                        <p className="text-xs text-gray-500">
                          {summary
                            ? `${summary.transactionCount} transactions · Last ${summary.lastDate ? formatDate(summary.lastDate) : "—"}`
                            : "No activity"}
                        </p>
                      </div>
                      <ToggleSwitch
                        enabled={!!accountNotifications[account]}
                        onChange={() => toggleAccountNotification(account)}
                        label={`Toggle notifications for ${account}`}
                      />
                    </div>
                  );
                })}
                {!accounts.length && (
                  <p className="text-sm text-gray-500">
                    No accounts available. Transactions will populate this list.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Spending alerts
                </h2>
                <span className="text-xs text-green-600">Adaptive limits</span>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Set daily spend limits per account to receive proactive
                warnings.
              </p>
              <div className="mt-4 space-y-3">
                <label
                  className="text-xs font-medium uppercase tracking-wide text-gray-500"
                  htmlFor="primary-account"
                >
                  Primary account
                </label>
                <select
                  id="primary-account"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
                  value={preferredAccount}
                  onChange={(event) => setPreferredAccount(event.target.value)}
                >
                  <option value="" disabled>
                    Select an account
                  </option>
                  {accounts.map((account) => (
                    <option key={account} value={account}>
                      {account}
                    </option>
                  ))}
                </select>

                <div className="mt-4 space-y-3">
                  {accounts.map((account) => (
                    <div
                      key={account}
                      className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900">{account}</p>
                        <span className="text-xs text-gray-500">
                          Suggested {formatCurrency(dailyLimits[account] ?? 0)}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-3">
                        <input
                          type="number"
                          min={0}
                          className="w-32 rounded-md border border-gray-200 px-2 py-1 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
                          value={dailyLimits[account] ?? 0}
                          onChange={(event) =>
                            updateDailyLimit(
                              account,
                              Number(event.target.value) || 0,
                            )
                          }
                        />
                        <span className="text-sm text-gray-600">
                          CHF per day
                        </span>
                      </div>
                    </div>
                  ))}
                  {!accounts.length && (
                    <p className="text-sm text-gray-500">
                      Add transactions to configure spend alerts.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Merchant controls
                </h2>
                <span className="text-xs text-blue-600">Risk monitoring</span>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Keep an eye on merchants with high spend or unusual activity.
              </p>
              <div className="mt-4 space-y-3">
                {topMerchants.map(([merchant, amount]) => (
                  <div
                    key={merchant}
                    className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{merchant}</p>
                      <p className="text-xs text-gray-500">
                        {formatCurrency(amount)} spent in recent activity
                      </p>
                    </div>
                    <ToggleSwitch
                      enabled={!!merchantWatchlist[merchant]}
                      onChange={() => toggleMerchant(merchant)}
                      label={`Toggle watchlist for ${merchant}`}
                    />
                  </div>
                ))}
                {!topMerchants.length && (
                  <p className="text-sm text-gray-500">
                    Not enough recent activity to highlight merchants yet.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Security
                </h2>
                <span className="text-xs text-purple-600">
                  Protection layers
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Strengthen access to your banking experience with layered
                security options.
              </p>
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Biometric login</p>
                    <p className="text-xs text-gray-500">
                      Use Face ID or Touch ID when available
                    </p>
                  </div>
                  <ToggleSwitch
                    enabled={securitySettings.biometricLogin}
                    onChange={() => toggleSecurity("biometricLogin")}
                    label="Toggle biometric login"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      Two-factor confirmation
                    </p>
                    <p className="text-xs text-gray-500">
                      Require SMS code for sensitive changes
                    </p>
                  </div>
                  <ToggleSwitch
                    enabled={securitySettings.twoFactor}
                    onChange={() => toggleSecurity("twoFactor")}
                    label="Toggle two factor"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Card freezing</p>
                    <p className="text-xs text-gray-500">
                      Allow instant freeze from the dashboard
                    </p>
                  </div>
                  <ToggleSwitch
                    enabled={securitySettings.cardFreezing}
                    onChange={() => toggleSecurity("cardFreezing")}
                    label="Toggle card freezing"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      Location-based alerts
                    </p>
                    <p className="text-xs text-gray-500">
                      Notify when card usage occurs abroad
                    </p>
                  </div>
                  <ToggleSwitch
                    enabled={securitySettings.locationAlerts}
                    onChange={() => toggleSecurity("locationAlerts")}
                    label="Toggle location alerts"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Data export & recovery
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Download your transaction history or request a data clean-up.
                </p>
              </div>
              <Lock className="h-6 w-6 text-gray-400" />
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
              >
                Export last 90 days
              </button>
              <button
                type="button"
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
              >
                Request complete archive
              </button>
              <button
                type="button"
                className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:border-red-300 hover:bg-red-50"
              >
                Initiate data clean-up
              </button>
            </div>
          </section>

          <div className="flex flex-col items-start gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Review your preferences before saving. Updates sync locally for
                now.
              </p>
              {feedback && (
                <p className="mt-1 text-sm text-green-600">{feedback}</p>
              )}
            </div>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-200"
            >
              Save changes
            </button>
          </div>
        </>
      )}
    </div>
  );
}
