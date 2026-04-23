import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { db } from '@/db/index';
import { categories, workouts } from '@/db/schema';
import { Ionicons } from '@expo/vector-icons';
import { desc, eq } from 'drizzle-orm';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useContext, useState } from 'react';
import {
    Alert,
    FlatList,
    ScrollView,
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

type Category = {
    id: number;
    name: string;
    colour: string;
};

export default function WorkoutsScreen() {
    const auth = useContext(AuthContext);
    const [workoutList, setWorkoutList] = useState<WorkoutWithCategory[]>([]);
    const [catList, setCatList] = useState<Category[]>([]);
    const [search, setSearch] = useState('');
    const [selectedCat, setSelectedCat] = useState<number | null>(null);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [showFilters, setShowFilters] = useState(false);

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

        const cats = await db
            .select()
            .from(categories)
            .where(eq(categories.userId, auth.user.id));
        setCatList(cats);
    };

    useFocusEffect(
        useCallback(() => {
            loadWorkouts();
        }, [auth?.user])
    );

    const filtered = workoutList.filter((w) => {
        const matchesSearch =
            w.categoryName.toLowerCase().includes(search.toLowerCase()) ||
            (w.notes?.toLowerCase().includes(search.toLowerCase()) ?? false);
        const matchesCat = selectedCat === null || w.categoryName === catList.find(c => c.id === selectedCat)?.name;
        const matchesFrom = dateFrom === '' || w.date >= dateFrom;
        const matchesTo = dateTo === '' || w.date <= dateTo;
        return matchesSearch && matchesCat && matchesFrom && matchesTo;
    });

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

    const clearFilters = () => {
        setSelectedCat(null);
        setDateFrom('');
        setDateTo('');
        setSearch('');
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Workouts</Text>
                <View style={styles.headerRight}>
                    <TouchableOpacity
                        style={styles.filterBtn}
                        onPress={() => setShowFilters(!showFilters)}
                        accessibilityLabel="Toggle filters"
                    >
                        <Ionicons name="filter-outline" size={20} color={showFilters ? Colors.primary : Colors.textMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.addBtn}
                        onPress={() => router.push('/workout/add')}
                        accessibilityLabel="Add workout"
                    >
                        <Ionicons name="add" size={24} color={Colors.background} />
                    </TouchableOpacity>
                </View>
            </View>

            <TextInput
                style={styles.search}
                placeholder="Search workouts..."
                placeholderTextColor={Colors.textDim}
                value={search}
                onChangeText={setSearch}
                accessibilityLabel="Search workouts"
            />

            {showFilters && (
                <View style={styles.filterPanel}>
                    <Text style={styles.filterLabel}>Category</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow}>
                        <TouchableOpacity
                            style={[styles.catChip, selectedCat === null && styles.catChipActive]}
                            onPress={() => setSelectedCat(null)}
                        >
                            <Text style={[styles.catChipText, selectedCat === null && styles.catChipTextActive]}>All</Text>
                        </TouchableOpacity>
                        {catList.map((cat) => (
                            <TouchableOpacity
                                key={cat.id}
                                style={[styles.catChip, selectedCat === cat.id && { backgroundColor: cat.colour, borderColor: cat.colour }]}
                                onPress={() => setSelectedCat(cat.id)}
                            >
                                <Text style={[styles.catChipText, selectedCat === cat.id && { color: Colors.background }]}>
                                    {cat.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <Text style={styles.filterLabel}>Date Range</Text>
                    <View style={styles.dateRow}>
                        <TextInput
                            style={[styles.dateInput]}
                            placeholder="From YYYY-MM-DD"
                            placeholderTextColor={Colors.textDim}
                            value={dateFrom}
                            onChangeText={setDateFrom}
                            accessibilityLabel="Date from filter"
                        />
                        <TextInput
                            style={[styles.dateInput]}
                            placeholder="To YYYY-MM-DD"
                            placeholderTextColor={Colors.textDim}
                            value={dateTo}
                            onChangeText={setDateTo}
                            accessibilityLabel="Date to filter"
                        />
                    </View>

                    <TouchableOpacity onPress={clearFilters} style={styles.clearBtn}>
                        <Text style={styles.clearBtnText}>Clear Filters</Text>
                    </TouchableOpacity>
                </View>
            )}

            {filtered.length === 0 ? (
                <View style={styles.empty}>
                    <Ionicons name="barbell-outline" size={48} color={Colors.textDim} />
                    <Text style={styles.emptyText}>No workouts found</Text>
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
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    title: { fontSize: Fonts.sizes.xxl, fontWeight: '800', color: Colors.text },
    addBtn: { backgroundColor: Colors.primary, borderRadius: Radius.full, width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    filterBtn: { padding: Spacing.xs },
    search: { marginHorizontal: Spacing.md, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.cardBorder, borderRadius: Radius.md, padding: Spacing.md, color: Colors.text, marginBottom: Spacing.sm },
    filterPanel: { marginHorizontal: Spacing.md, backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.cardBorder },
    filterLabel: { fontSize: Fonts.sizes.xs, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.xs },
    catRow: { marginBottom: Spacing.md },
    catChip: { borderWidth: 1, borderColor: Colors.cardBorder, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, marginRight: Spacing.sm, backgroundColor: Colors.background },
    catChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    catChipText: { color: Colors.text, fontSize: Fonts.sizes.sm, fontWeight: '600' },
    catChipTextActive: { color: Colors.background },
    dateRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
    dateInput: { flex: 1, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.cardBorder, borderRadius: Radius.sm, padding: Spacing.sm, color: Colors.text, fontSize: Fonts.sizes.xs },
    clearBtn: { alignSelf: 'flex-end' },
    clearBtnText: { color: Colors.danger, fontSize: Fonts.sizes.sm, fontWeight: '600' },
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
