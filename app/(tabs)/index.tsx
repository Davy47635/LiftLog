import { Colors, Fonts, Spacing } from '@/constants/theme';
import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../_layout';

export default function HomeScreen() {
  const auth = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>💪</Text>
      <Text style={styles.title}>LiftLog</Text>
      <Text style={styles.welcome}>
        Welcome back, {auth?.user?.name ?? 'Athlete'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  logo: { fontSize: 64 },
  title: {
    fontSize: Fonts.sizes.xxxl,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -1,
    marginTop: Spacing.sm,
  },
  welcome: {
    fontSize: Fonts.sizes.md,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },
});
