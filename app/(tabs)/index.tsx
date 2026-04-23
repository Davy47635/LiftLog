import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { db } from '@/db/index';
import { categories, workouts } from '@/db/schema';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { desc, eq } from 'drizzle-orm';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useContext, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AuthContext } from '../_layout';

type RecentWorkout = {
  id: number;
  date: string;
  durationMins: number;
  categoryName: string;
  categoryColour: string;
};

function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  const sorted = [...new Set(dates)].sort().reverse();
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (sorted[0] !== today && sorted[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const curr = new Date(sorted[i - 1]);
    const prev = new Date(sorted[i]);
    const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000);
    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export default function HomeScreen() {
  const auth = useContext(AuthContext);
  const [recent, setRecent] = useState<RecentWorkout[]>([]);
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [weeklyCount, setWeeklyCount] = useState(0);
  const [streak, setStreak] = useState(0);

  const load = async () => {
    const stored = await AsyncStorage.getItem('userId');
    if (!stored) return;
    const userId = parseInt(stored);

    const allWorkouts = await db
      .select({
        id: workouts.id,
        date: workouts.date,
        durationMins: workouts.durationMins,
        categoryName: categories.name,
        categoryColour: categories.colour,
      })
      .from(workouts)
      .innerJoin(categories, eq(workouts.categoryId, categories.id))
      .where(eq(workouts.userId, userId))
      .orderBy(desc(workouts.date));

    setTotalWorkouts(allWorkouts.length);
    setRecent(allWorkouts.slice(0, 3));

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const weekStartStr = weekStart.toISOString().split('T')[0];
    const thisWeek = allWorkouts.filter((w) => w.date >= weekStartStr);
    setWeeklyCount(thisWeek.length);

    const streakVal = calculateStreak(allWorkouts.map((w) => w.date));
    setStreak(streakVal);
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IE', { day: 'numeric', month: 'short' });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{auth?.user?.name ?? 'Athlete'} 💪</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: 100 }}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{weeklyCount}</Text>
            <Text style={styles.statLabel}>This week</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalWorkouts}</Text>
            <Text style={styles.statLabel}>Total sessions</Text>
          </View>
        </View>

        <View style={[styles.streakCard, streak > 0 && styles.streakCardActive]}>
          <Text style={styles.streakEmoji}>{streak > 0 ? '🔥' : '💤'}</Text>
          <View>
            <Text style={styles.streakValue}>{streak} day streak</Text>
            <Text style={styles.streakLabel}>
              {streak > 0 ? 'Keep it up!' : 'Log a workout to start your streak'}
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Workouts</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/workouts')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {recent.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="barbell-outline" size={48} color={Colors.textDim} />
            <Text style={styles.emptyText}>No workouts yet</Text>
            <TouchableOpacity
              style={styles.startBtn}
              onPress={() => router.push('/workout/add')}
            >
              <Text style={styles.startBtnText}>Log your first workout</Text>
            </TouchableOpacity>
          </View>
        ) : (
          recent.map((w) => (
            <TouchableOpacity
              key={w.id}
              style={styles.card}
              onPress={() => router.push(`/workout/${w.id}`)}
            >
              <View style={[styles.dot, { backgroundColor: w.categoryColour }]} />
              <View style={styles.cardBody}>
                <Text style={styles.cardCategory}>{w.categoryName}</Text>
                <Text style={styles.cardDate}>{formatDate(w.date)}</Text>
              </View>
              <Text style={styles.cardDuration}>{w.durationMins}m</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingTop: 60 },
  header: { paddingHorizontal: Spacing.md, marginBottom: Spacing.lg },
  greeting: { fontSize: Fonts.sizes.md, color: Colors.textMuted },
  name: { fontSize: Fonts.sizes.xxl, fontWeight: '800', color: Colors.text },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  statCard: { flex: 1, backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.cardBorder },
  statValue: { fontSize: Fonts.sizes.xxxl, fontWeight: '800', color: Colors.primary },
  statLabel: { fontSize: Fonts.sizes.sm, color: Colors.textMuted, marginTop: 4 },
  streakCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.cardBorder },
  streakCardActive: { borderColor: Colors.warning },
  streakEmoji: { fontSize: 36 },
  streakValue: { fontSize: Fonts.sizes.lg, fontWeight: '800', color: Colors.text },
  streakLabel: { fontSize: Fonts.sizes.sm, color: Colors.textMuted, marginTop: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  sectionTitle: { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.text },
  seeAll: { fontSize: Fonts.sizes.sm, color: Colors.primary, fontWeight: '600' },
  empty: { alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xl },
  emptyText: { color: Colors.textMuted, fontSize: Fonts.sizes.lg, fontWeight: '600' },
  startBtn: { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, marginTop: Spacing.sm },
  startBtnText: { color: Colors.background, fontWeight: '800', fontSize: Fonts.sizes.md },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.cardBorder },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: Spacing.md },
  cardBody: { flex: 1 },
  cardCategory: { color: Colors.text, fontWeight: '700', fontSize: Fonts.sizes.md },
  cardDate: { color: Colors.textMuted, fontSize: Fonts.sizes.sm, marginTop: 2 },
  cardDuration: { color: Colors.primary, fontWeight: '700', fontSize: Fonts.sizes.sm },
});
