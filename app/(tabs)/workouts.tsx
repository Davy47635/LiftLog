import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { db } from '@/db/index';
import { categories, workouts } from '@/db/schema';
import { Ionicons } from '@expo/vector-icons';
import { desc, eq } from 'drizzle-orm';
import { router } from 'expo-router';
import { useContext, useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { AuthContext } from '../_layout';

type WorkoutWithCategory = {
    id: number;
    date: string;
    durationMins: number;
    notes: string | null;
    categoryName: string;
    categoryColour: string;
};

export default function WorkoutsScreen() {
    const auth = useContext(AuthContext);
    const [workoutList, setWorkoutList] = useState<WorkoutWithCategory[]>([]);
    const [search, setSearch] = useState('');

    const loadWorkouts = async () => {
        if (!auth?.user) return;
        const rows = await db
            .select({
                id: workouts.id,
                date: workouts.date,
                durationMins: workouts.durationMins,
                notes: workouts.notes,
                categoryName: categories.name,
                categoryColour: categories.colour,
            })
            .from(workouts)
            .innerJoin(categories, eq(workouts.categoryId, categories.id))
            .where(eq(workouts.userId, auth.user.id))
            .orderBy(desc(workouts.date));
        setWorkoutList(rows);
    };

    useEffect(() => {
        loadWorkouts();
    }, []);

    const filtered = workoutList.filter((w) =>
        w.categoryName.toLowerCase().includes(search.toLowerCase()) ||
        (w.notes?.toLowerCase().includes(search.toLowerCase()) ?? false)
    );

    const deleteWorkout = async (id: number) => {
        Alert.alert('Delete Workout', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    await db.delete(workouts).where(eq(workouts.id, id));
                    loadWorkouts();
                },
            },
        ]);
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Workouts</Text>
                <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => router.push('/workout/add')}
                    accessibilityLabel="Add workout"
                >
                    <Ionicons name="add" size={24} color={Colors.background} />
                </TouchableOpacity>
            </View>

            <TextInput
                style={styles.search}
                placeholder="Search workouts..."
                placeholderTextColor={Colors.textDim}
                value={search}
                onChangeText={setSearch}
                accessibilityLabel="Search workouts"
            />

            {filtered.length === 0 ? (
                <View style={styles.empty}>
                    <Ionicons name="barbell-outline" size={48} color={Colors.textDim} />
                    <Text style={styles.emptyText}>No workouts yet</Text>
                    <Text style={styles.emptySubtext}>Tap + to log your first session</Text>
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.card}
                            onPress={() => router.push(`/workout/${item.id}`)}
                            accessibilityLabel={`${item.categoryName} workout`}
                        >
                            <View style={[styles.dot, { backgroundColor: item.categoryColour }]} />
                            <View style={styles.cardBody}>
                                <Text style={styles.cardCategory}>{item.categoryName}</Text>
                                <Text style={styles.cardDate}>{formatDate(item.date)}</Text>
                                {item.notes ? <Text style={styles.cardNotes} numberOfLines={1}>{item.notes}</Text> : null}
                            </View>
                            <View style={styles.cardRight}>
                                <Text style={styles.cardDuration}>{item.durationMins}m</Text>
                                <TouchableOpacity onPress={() => deleteWorkout(item.id)} accessibilityLabel="Delete workout">
                                    <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background, paddingTop: 60 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, marginBottom: Spacing.md },
    title: { fontSize: Fonts.sizes.xxl, fontWeight: '800', color: Colors.text },
    addBtn: { backgroundColor: Colors.primary, borderRadius: Radius.full, width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    search: { marginHorizontal: Spacing.md, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.cardBorder, borderRadius: Radius.md, padding: Spacing.md, color: Colors.text, marginBottom: Spacing.md },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.sm },
    emptyText: { color: Colors.textMuted, fontSize: Fonts.sizes.lg, fontWeight: '600' },
    emptySubtext: { color: Colors.textDim, fontSize: Fonts.sizes.sm },
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, marginHorizontal: Spacing.md, marginBottom: Spacing.sm, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.cardBorder },
    dot: { width: 12, height: 12, borderRadius: 6, marginRight: Spacing.md },
    cardBody: { flex: 1 },
    cardCategory: { color: Colors.text, fontWeight: '700', fontSize: Fonts.sizes.md },
    cardDate: { color: Colors.textMuted, fontSize: Fonts.sizes.sm, marginTop: 2 },
    cardNotes: { color: Colors.textDim, fontSize: Fonts.sizes.xs, marginTop: 2 },
    cardRight: { alignItems: 'flex-end', gap: Spacing.sm },
    cardDuration: { color: Colors.primary, fontWeight: '700', fontSize: Fonts.sizes.sm },
});
