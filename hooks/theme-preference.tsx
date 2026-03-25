import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

import { useColorScheme as useDeviceColorScheme } from "@/hooks/use-color-scheme";

export type ThemePreference = "device" | "dark" | "light";

type ThemePreferenceContextValue = {
  preference: ThemePreference;
  resolvedScheme: "dark" | "light";
  setPreference: (next: ThemePreference) => Promise<void>;
};

const THEME_PREF_STORAGE_KEY = "@tonebook/theme-preference/v1";

const ThemePreferenceContext =
  createContext<ThemePreferenceContextValue | null>(null);

export function ThemePreferenceProvider({ children }: { children: ReactNode }) {
  const deviceScheme = useDeviceColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>("device");

  useEffect(() => {
    let mounted = true;

    AsyncStorage.getItem(THEME_PREF_STORAGE_KEY)
      .then((stored) => {
        if (!mounted) {
          return;
        }
        if (stored === "device" || stored === "dark" || stored === "light") {
          setPreferenceState(stored);
        }
      })
      .catch(() => {
        // Keep default preference on storage failures.
      });

    return () => {
      mounted = false;
    };
  }, []);

  const setPreference = async (next: ThemePreference) => {
    setPreferenceState(next);
    try {
      await AsyncStorage.setItem(THEME_PREF_STORAGE_KEY, next);
    } catch {
      // Keep runtime state even when persistence fails.
    }
  };

  const resolvedScheme: "dark" | "light" =
    preference === "device" ? (deviceScheme ?? "light") : preference;

  const value = useMemo(
    () => ({ preference, resolvedScheme, setPreference }),
    [preference, resolvedScheme],
  );

  return (
    <ThemePreferenceContext.Provider value={value}>
      {children}
    </ThemePreferenceContext.Provider>
  );
}

export function useThemePreference(): ThemePreferenceContextValue {
  const context = useContext(ThemePreferenceContext);
  if (!context) {
    throw new Error(
      "useThemePreference must be used within a ThemePreferenceProvider",
    );
  }
  return context;
}
