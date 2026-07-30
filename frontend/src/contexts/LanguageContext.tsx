import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import vi from "@/locales/vi";
import en from "@/locales/en";

type Lang = "vi" | "en";

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>(null!);

const translations: Record<Lang, Record<string, any>> = { vi, en };

const resolveNested = (obj: Record<string, any>, path: string): string => {
  const keys = path.split(".");
  let value: any = obj;
  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = value[k];
    } else {
      return path;
    }
  }
  return typeof value === "string" ? value : path;
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Lang>(() => {
    try {
      return (localStorage.getItem("lang") as Lang) || "vi";
    } catch {
      return "vi";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("lang", lang);
    } catch {}
    document.documentElement.setAttribute("lang", lang);
  }, [lang]);

  const t = (key: string): string => resolveNested(translations[lang], key);
  const toggleLang = () => setLang((prev) => (prev === "vi" ? "en" : "vi"));

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};
