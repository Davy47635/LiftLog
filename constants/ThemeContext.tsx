import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { DarkColors, LightColors } from './theme';

type ThemeContextType = {
    isDark: boolean;
    toggleTheme: () => void;
    colors: typeof DarkColors;
};

export const ThemeContext = createContext<ThemeContextType>({
    isDark: true,
    toggleTheme: () => { },
    colors: DarkColors,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [isDark, setIsDark] = useState(true);

    useEffect(() => {
        AsyncStorage.getItem('theme').then((val) => {
            if (val === 'light') setIsDark(false);
        });
    }, []);

    const toggleTheme = useCallback(async () => {
        const next = !isDark;
        setIsDark(next);
        await AsyncStorage.setItem('theme', next ? 'dark' : 'light');
    }, [isDark]);

    const value = {
        isDark,
        toggleTheme,
        colors: isDark ? DarkColors : LightColors,
    };

    return React.createElement(ThemeContext.Provider, { value }, children);
}

export function useTheme() {
    return useContext(ThemeContext);
}
