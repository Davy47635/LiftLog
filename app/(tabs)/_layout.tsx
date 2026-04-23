import { ThemeProvider } from '@/constants/ThemeContext';
import { db } from '@/db/index';
import { runMigrations } from '@/db/migrate';
import { users } from '@/db/schema';
import { seedDatabase } from '@/db/seed';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { eq } from 'drizzle-orm';
import { Stack, router } from 'expo-router';
import { createContext, useContext, useEffect, useState } from 'react';

export type User = {
  id: number;
  name: string;
  email: string;
};

type AuthContextType = {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  return useContext(AuthContext);
}

export default function RootLayout() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const init = async () => {
      await runMigrations();
      const storedId = await AsyncStorage.getItem('userId');
      if (storedId) {
        const rows = await db
          .select()
          .from(users)
          .where(eq(users.id, parseInt(storedId)));
        if (rows.length > 0) {
          const u = rows[0];
          setUser({ id: u.id, name: u.name, email: u.email });
          await seedDatabase(u.id);
          router.replace('/(tabs)');
          return;
        }
      }
      router.replace('/login');
    };
    void init();
  }, []);

  return (
    <ThemeProvider>
      <AuthContext.Provider value={{ user, setUser }}>
        <Stack screenOptions={{ headerShown: false }} />
      </AuthContext.Provider>
    </ThemeProvider>
  );
}
