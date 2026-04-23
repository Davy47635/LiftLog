import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { db } from '@/db/index';
import { categories, workouts } from '@/db/schema';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { eq } from 'drizzle-orm';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { BarChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export default function InsightsScreen() {
    const [weeklyData, setWeeklyData] = useState<number[]>([0, 0, 0, 0]);
    const [categoryData, setCategoryData] = useState<{ name: string; count: number; colour: string }[]>([]);
    const [totalWorkouts, setTotalWorkouts] = useState(0);
    const [totalMins, setTotalMins] = useState(0);

    const loadInsights = async () => {
        const stored = await AsyncStorage.getItem('userId');
        if (!stored) return;
        const userId = parseInt(stored);

        const allWorkouts = await db
            .select()
            .from(workouts)
            .where(eq(workouts.userId, userId));

        setTotalWorkouts(allWorkouts.length);
        setTotalMins(allWorkouts.reduce((sum, w) => sum + w.durationMins, 0));

        // Weekly breakdown (last 4 weeks)
        const now = new Date();
        const weekly = [0, 0, 0, 0];
        allWorkouts.forEach((w) => {
            const d = new Date(w.date);
            const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24 * 7));
            if (diff >= 0 && diff < 4) weekly[3 - diff]++;
        });
        setWeeklyData(weekly);

        // Category breakdown
        const cats = await db
            .select()
            .from(categories)
            .where(eq(categories.userId, userId));

        const catCount: Record<number, number> = {};
        allWorkouts.forEach((w) => {
            catCount[w.categoryId] = (catCount[w.categoryId] ?? 0) + 1;
        });

        const catData = cats
            .map((c) => ({ name: c.name, count: catCount[c.id] ?? 0, colour: c.colour }))
            .filter((c) => c.count > 0)
            .sort((a, b) => b.count - a.count);

        setCategoryData(catData);
    };

    useFocusEffect(
        useCallback(() => {
            loadInsights();
        }, [])
    );

    const weeks = ['3w ago', '2w ago', 'Last wk', 'This wk'];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Insights</Text>
            </View>

            <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: 100 }}>

                {/* Summary cards */}
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{totalWorkouts}</Text>
                        <Text style={styles.statLabel}>Total Sessions</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{Math.round(totalMins / 60)}h</Text>
                        <Text style={styles.statLabel}>Total Time</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>
                            {totalWorkouts > 0 ? Math.round(totalMins / totalWorkouts) : 0}m
                        </Text>
                        <Text style={styles.statLabel}>Avg Session</Text>
                    </View>
                </View>

                {/* Bar chart */}
                <Text style={styles.sectionTitle}>Sessions per week</Text>
                <View style={styles.chartCard}>
                    <BarChart
                        data={{
                            labels: weeks,
                            datasets: [{ data: weeklyData }],
                        }}
                        width={screenWidth - Spacing.md * 2 - Spacing.md * 2}
                        height={180}
                        yAxisLabel=""
                        yAxisSuffix=""
                        chartConfig={{
                            backgroundColor: Colors.card,
                            backgroundGradientFrom: Colors.card,
                            backgroundGradientTo: Colors.card,
                            decimalPlaces: 0,
                            color: () => Colors.primary,
                            labelColor: () => Colors.textMuted,
                            style: { borderRadius: Radius.md },
                            barPercentage: 0.6,
                        }}
                        style={{ borderRadius: Radius.md }}
                        showValuesOnTopOfBars
                        fromZero
                    />
                </View>

                {/* Category breakdown */}
                <Text style={styles.sectionTitle}>By category</Text>
                {categoryData.map((cat) => (
                    <View key={cat.name} style={styles.catRow}>
                        <View style={[styles.catDot, { backgroundColor: cat.colour }]} />
                        <Text style={styles.catName}>{cat.name}</Text>
                        <Text style={styles.catCount}>{cat.count} sessions</Text>
                    </View>
                ))}

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background, paddingTop: 60 },
    header: { paddingHorizontal: Spacing.md, marginBottom: Spacing.md },
    title: { fontSize: Fonts.sizes.xxl, fontWeight: '800', color: Colors.text },
    statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
    statCard: { flex: 1, backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.cardBorder },
    statValue: { fontSize: Fonts.sizes.xl, fontWeight: '800', color: Colors.primary },
    statLabel: { fontSize: Fonts.sizes.xs, color: Colors.textMuted, marginTop: 4, textAlign: 'center' },
    sectionTitle: { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
    chartCard: { backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.cardBorder },
    catRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.cardBorder },
    catDot: { width: 12, height: 12, borderRadius: 6, marginRight: Spacing.sm },
    catName: { flex: 1, color: Colors.text, fontWeight: '600', fontSize: Fonts.sizes.md },
    catCount: { color: Colors.primary, fontWeight: '700', fontSize: Fonts.sizes.sm },
});
