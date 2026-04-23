import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { db } from '@/db/index';
import { categories, targets, workouts } from '@/db/schema';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { and, eq, gte } from 'drizzle-orm';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

type TargetWithProgress = {
    id: number;
    period: string;
    targetValue: number;
    categoryName: string | null;
    categoryColour: string | null;
    progress: number;
};

export default function TargetsScreen() {
    const [targetList, setTargetList] = useState<TargetWithProgress[]>([]);

    const loadTargets = async () => {
        const stored = await AsyncStorage.getItem('userId');
        if (!stored) return;
        const userId = parseInt(stored);

        const rows = await db
            .select()
            .from(targets)
            .where(eq(targets.userId, userId));

        const cats = await db
            .select()
            .from(categories)
            .where(eq(categories.userId, userId));

        const catMap: Record<number, { name: string; colour: string }> = {};
        cats.forEach((c) => (catMap[c.id] = { name: c.name, colour: c.colour }));

        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const result: TargetWithProgress[] = [];

        for (const t of rows) {
            const startDate = t.period === 'weekly'
                ? weekStart.toISOString().split('T')[0]
                : monthStart.toISOString().split('T')[0];

            let query = db
                .select()
                .from(workouts)
                .where(
                    and(
                        eq(workouts.userId, userId),
                        gte(workouts.date, startDate)
                    )
                );

            const allWorkouts = await query;
            const filtered = t.categoryId
                ? allWorkouts.filter((w) => w.categoryId === t.categoryId)
                : allWorkouts;

            result.push({
                id: t.id,
                period: t.period,
                targetValue: t.targetValue,
                categoryName: t.categoryId ? catMap[t.categoryId]?.name ?? null : null,
                categoryColour: t.categoryId ? catMap[t.categoryId]?.colour ?? null : null,
                progress: filtered.length,
            });
        }

        setTargetList(result);
    };

    useFocusEffect(
        useCallback(() => {
            loadTargets();
        }, [])
    );

    const deleteTarget = async (id: number) => {
        Alert.alert('Delete Target', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    await db.delete(targets).where(eq(targets.id, id));
                    loadTargets();
                },
            },
        ]);
    };

    const getStatus = (progress: number, target: number) => {
        if (progress >= target) return { color: Colors.success, label: 'Achieved! 🎉' };
        if (progress >= target * 0.7) return { color: Colors.warning, label: 'Almost there' };
        return { color: Colors.danger, label: 'Keep going' };
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Targets</Text>
            </View>

            <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: 100 }}>
                {targetList.length === 0 ? (
                    <View style={styles.empty}>
                        <Ionicons name="trophy-outline" size={48} color={Colors.textDim} />
                        <Text style={styles.emptyText}>No targets set</Text>
                    </View>
                ) : (
                    targetList.map((t) => {
                        const pct = Math.min((t.progress / t.targetValue) * 100, 100);
                        const status = getStatus(t.progress, t.targetValue);
                        return (
                            <View key={t.id} style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <View>
                                        <Text style={styles.cardTitle}>
                                            {t.categoryName ?? 'All workouts'}
                                        </Text>
                                        <Text style={styles.cardPeriod}>
                                            {t.period.charAt(0).toUpperCase() + t.period.slice(1)} goal
                                        </Text>
                                    </View>
                                    <TouchableOpacity onPress={() => deleteTarget(t.id)}>
                                        <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.progressBar}>
                                    <View style={[styles.progressFill, { width: `${pct}%` as any, backgroundColor: status.color }]} />
                                </View>

                                <View style={styles.cardFooter}>
                                    <Text style={styles.progressText}>
                                        {t.progress} / {t.targetValue} sessions
                                    </Text>
                                    <Text style={[styles.statusText, { color: status.color }]}>
                                        {status.label}
                                    </Text>
                                </View>
                            </View>
                        );
                    })
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background, paddingTop: 60 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, marginBottom: Spacing.md },
    title: { fontSize: Fonts.sizes.xxl, fontWeight: '800', color: Colors.text },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.sm, marginTop: 100 },
    emptyText: { color: Colors.textMuted, fontSize: Fonts.sizes.lg, fontWeight: '600' },
    card: { backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.cardBorder },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.md },
    cardTitle: { color: Colors.text, fontWeight: '700', fontSize: Fonts.sizes.lg },
    cardPeriod: { color: Colors.textMuted, fontSize: Fonts.sizes.sm, marginTop: 2 },
    progressBar: { height: 8, backgroundColor: Colors.cardBorder, borderRadius: Radius.full, overflow: 'hidden', marginBottom: Spacing.sm },
    progressFill: { height: '100%', borderRadius: Radius.full },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    progressText: { color: Colors.textMuted, fontSize: Fonts.sizes.sm },
    statusText: { fontSize: Fonts.sizes.sm, fontWeight: '700' },
});
