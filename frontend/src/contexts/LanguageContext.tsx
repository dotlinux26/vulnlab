import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import vi from "@/locales/vi.json";
import en from "@/locales/en.json";

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
    if (typeof window !== "undefined") {
      return (localStorage.getItem("lang") as Lang) || "vi";
    }
    return "vi";
  });

  useEffect(() => {
    localStorage.setItem("lang", lang);
    document.documentElement.setAttribute("lang", lang);
  }, [lang]);

  const t = (key: string): string => {
    return resolveNested(translations[lang], key);
  };

  const toggleLang = () => setLang((prev) => (prev === "vi" ? "en" : "vi"));

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
