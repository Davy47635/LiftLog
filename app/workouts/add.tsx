import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { db } from '@/db/index';
import { categories, workouts } from '@/db/schema';
import { Ionicons } from '@expo/vector-icons';
import { eq } from 'drizzle-orm';
import { router } from 'expo-router';
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

export default function AddWorkoutScreen() {
    const auth = useContext(AuthContext);
    const [catList, setCatList] = useState<{ id: number; name: string; colour: string }[]>([]);
    const [selectedCat, setSelectedCat] = useState<number | null>(null);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [duration, setDuration] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const load = async () => {
            if (!auth?.user) return;
            const rows = await db
                .select()
                .from(categories)
                .where(eq(categories.userId, auth.user.id));
            setCatList(rows);
            if (rows.length > 0) setSelectedCat(rows[0].id);
        };
        load();
    }, []);

    const handleSave = async () => {
        if (!selectedCat) { Alert.alert('Error', 'Please select a category'); return; }
        if (!duration || isNaN(Number(duration))) { Alert.alert('Error', 'Please enter a valid duration'); return; }
        if (!auth?.user) return;
        setLoading(true);
        try {
            await db.insert(workouts).values({
                userId: auth.user.id,
                categoryId: selectedCat,
                date,
                durationMins: parseInt(duration),
                notes: notes.trim() || null,
                createdAt: new Date().toISOString(),
            });
            router.back();
        } catch (e) {
            Alert.alert('Error', 'Could not save workout');
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
                <Text style={styles.title}>New Workout</Text>
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
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={Colors.textDim}
                    accessibilityLabel="Date input"
                />

                <Text style={styles.label}>Duration (minutes)</Text>
                <TextInput
                    style={styles.input}
                    value={duration}
                    onChangeText={setDuration}
                    placeholder="e.g. 60"
                    placeholderTextColor={Colors.textDim}
                    keyboardType="numeric"
                    accessibilityLabel="Duration input"
                />

                <Text style={styles.label}>Notes (optional)</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="How did it go?"
                    placeholderTextColor={Colors.textDim}
                    multiline
                    numberOfLines={4}
                    accessibilityLabel="Notes input"
                />

                <TouchableOpacity
                    style={[styles.btn, loading && styles.btnDisabled]}
                    onPress={handleSave}
                    disabled={loading}
                    accessibilityLabel="Save workout"
                >
                    <Text style={styles.btnText}>{loading ? 'Saving...' : 'Save Workout'}</Text>
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
    btn: { backgroundColor: Colors.primary, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', marginTop: Spacing.md },
    btnDisabled: { opacity: 0.6 },
    btnText: { color: Colors.background, fontWeight: '800', fontSize: Fonts.sizes.md },
});
