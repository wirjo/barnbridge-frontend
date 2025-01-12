import { createContext, useContext, useEffect, useState } from 'react';
import { useLocalStorage } from 'react-use-storage';

export type GeneralContextType = {
  navOpen: boolean;
  setNavOpen: React.Dispatch<React.SetStateAction<boolean>>;
  theme: 'light' | 'dark';
  selectedTheme: 'light' | 'dark' | undefined;
  toggleTheme: () => void;
};

const GeneralContext = createContext<GeneralContextType>({} as any);

const mqlDark = window.matchMedia('(prefers-color-scheme: dark)');
const defaultTheme = mqlDark.matches ? 'dark' : 'light';

type Props = {
  children: React.ReactNode;
};

const GeneralContextProvider: React.FC<Props> = ({ children }) => {
  const [navOpen, setNavOpen] = useState<boolean>(false);
  const [osColorScheme, setOsColorScheme] = useState<'light' | 'dark'>(defaultTheme);
  const [selectedTheme, setSelectedTheme, removeSelectedTheme] = useLocalStorage<'light' | 'dark' | undefined>(
    'bb_theme',
  );

  const theme: 'light' | 'dark' = selectedTheme || osColorScheme;

  useEffect(() => {
    setOsColorScheme(defaultTheme);

    mqlDark.addEventListener('change', e => {
      setOsColorScheme(e.matches ? 'dark' : 'light');
    });
  }, []);

  useEffect(() => {
    if (theme) {
      document.body.setAttribute('data-theme', theme);
    } else {
      document.body.removeAttribute('data-theme');
    }
  }, [theme]);

  return (
    <GeneralContext.Provider
      value={{
        navOpen,
        setNavOpen,
        theme,
        selectedTheme,
        toggleTheme: () => {
          if (selectedTheme === 'light') {
            setSelectedTheme('dark');
          } else if (selectedTheme === 'dark') {
            removeSelectedTheme();
          } else {
            setSelectedTheme('light');
          }
        },
      }}>
      {children}
    </GeneralContext.Provider>
  );
};

export default GeneralContextProvider;

export function useGeneral(): GeneralContextType {
  return useContext<GeneralContextType>(GeneralContext);
}
