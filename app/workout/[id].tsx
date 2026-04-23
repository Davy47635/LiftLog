import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { db } from '@/db/index';
import { categories, workoutLogs, workouts } from '@/db/schema';
import { Ionicons } from '@expo/vector-icons';
import { eq } from 'drizzle-orm';
import { router, useLocalSearchParams } from 'expo-router';
import { useContext, useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { AuthContext } from '../_layout';

export default function WorkoutDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const auth = useContext(AuthContext);
    const [catList, setCatList] = useState<{ id: number; name: string; colour: string }[]>([]);
    const [selectedCat, setSelectedCat] = useState<number | null>(null);
    const [date, setDate] = useState('');
    const [duration, setDuration] = useState('');
    const [notes, setNotes] = useState('');
    const [logs, setLogs] = useState<{ id: number; exerciseName: string; sets: number; reps: number; weightKg: number | null }[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const load = async () => {
            if (!auth?.user) return;
            const cats = await db.select().from(categories).where(eq(categories.userId, auth.user.id));
            setCatList(cats);

            const rows = await db.select().from(workouts).where(eq(workouts.id, parseInt(id)));
            if (rows.length > 0) {
                const w = rows[0];
                setSelectedCat(w.categoryId);
                setDate(w.date);
                setDuration(w.durationMins.toString());
                setNotes(w.notes ?? '');
            }

            const logRows = await db.select().from(workoutLogs).where(eq(workoutLogs.workoutId, parseInt(id)));
            setLogs(logRows);
        };
        load();
    }, [id]);

    const handleSave = async () => {
        if (!selectedCat || !duration) { Alert.alert('Error', 'Please fill in all fields'); return; }
        setLoading(true);
        try {
            await db.update(workouts)
                .set({ categoryId: selectedCat, date, durationMins: parseInt(duration), notes: notes.trim() || null })
                .where(eq(workouts.id, parseInt(id)));
            router.back();
        } catch (e) {
            Alert.alert('Error', 'Could not update workout');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Go back">
                    <Ionicons name="chevron-back" size={28} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Edit Workout</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView contentContainerStyle={styles.form}>
                <Text style={styles.label}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow}>
                    {catList.map((cat) => (
                        <TouchableOpacity
                            key={cat.id}
                            style={[styles.catChip, selectedCat === cat.id && { backgroundColor: cat.colour }]}
                            onPress={() => setSelectedCat(cat.id)}
                            accessibilityLabel={`Select ${cat.name} category`}
                        >
                            <Text style={[styles.catChipText, selectedCat === cat.id && { color: Colors.background }]}>
                                {cat.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <Text style={styles.label}>Date</Text>
                <TextInput
                    style={styles.input}
                    value={date}
                    onChangeText={setDate}
                    placeholderTextColor={Colors.textDim}
                    accessibilityLabel="Date input"
                />

                <Text style={styles.label}>Duration (minutes)</Text>
                <TextInput
                    style={styles.input}
                    value={duration}
                    onChangeText={setDuration}
                    keyboardType="numeric"
                    placeholderTextColor={Colors.textDim}
                    accessibilityLabel="Duration input"
                />

                <Text style={styles.label}>Notes</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    placeholderTextColor={Colors.textDim}
                    accessibilityLabel="Notes input"
                />

                {logs.length > 0 && (
                    <>
                        <Text style={styles.label}>Exercises</Text>
                        {logs.map((log) => (
                            <View key={log.id} style={styles.logCard}>
                                <Text style={styles.logName}>{log.exerciseName}</Text>
                                <Text style={styles.logDetail}>
                                    {log.sets} sets × {log.reps} reps
                                    {log.weightKg ? ` @ ${log.weightKg}kg` : ''}
                                </Text>
                            </View>
                        ))}
                    </>
                )}

                <TouchableOpacity
                    style={[styles.btn, loading && styles.btnDisabled]}
                    onPress={handleSave}
                    disabled={loading}
                    accessibilityLabel="Save changes"
                >
                    <Text style={styles.btnText}>{loading ? 'Saving...' : 'Save Changes'}</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background, paddingTop: 60 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, marginBottom: Spacing.lg },
    title: { fontSize: Fonts.sizes.xl, fontWeight: '800', color: Colors.text },
    form: { padding: Spacing.md, gap: Spacing.sm, paddingBottom: 100 },
    label: { fontSize: Fonts.sizes.sm, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
    input: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.cardBorder, borderRadius: Radius.md, padding: Spacing.md, color: Colors.text, fontSize: Fonts.sizes.md, marginBottom: Spacing.sm },
    textArea: { height: 100, textAlignVertical: 'top' },
    catRow: { marginBottom: Spacing.md },
    catChip: { borderWidth: 1, borderColor: Colors.cardBorder, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, marginRight: Spacing.sm, backgroundColor: Colors.card },
    catChipText: { color: Colors.text, fontSize: Fonts.sizes.sm, fontWeight: '600' },
    logCard: { backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.cardBorder },
    logName: { color: Colors.text, fontWeight: '700', fontSize: Fonts.sizes.md },
    logDetail: { color: Colors.textMuted, fontSize: Fonts.sizes.sm, marginTop: 2 },
    btn: { backgroundColor: Colors.primary, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', marginTop: Spacing.md },
    btnDisabled: { opacity: 0.6 },
    btnText: { color: Colors.background, fontWeight: '800', fontSize: Fonts.sizes.md },
});
