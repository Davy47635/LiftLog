import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { db } from '@/db/index';
import { categories, targets } from '@/db/schema';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { eq } from 'drizzle-orm';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function AddTargetScreen() {
    const [catList, setCatList] = useState<{ id: number; name: string }[]>([]);
    const [selectedCat, setSelectedCat] = useState<number | null>(null);
    const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');
    const [targetValue, setTargetValue] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const load = async () => {
            const stored = await AsyncStorage.getItem('userId');
            if (!stored) return;
            const rows = await db
                .select()
                .from(categories)
                .where(eq(categories.userId, parseInt(stored)));
            setCatList(rows);
        };
        load();
    }, []);

    const handleSave = async () => {
        if (!targetValue || isNaN(Number(targetValue))) {
            Alert.alert('Error', 'Please enter a valid target number');
            return;
        }
        const stored = await AsyncStorage.getItem('userId');
        if (!stored) return;
        setLoading(true);
        try {
            await db.insert(targets).values({
                userId: parseInt(stored),
                categoryId: selectedCat,
                period,
                targetValue: parseInt(targetValue),
                createdAt: new Date().toISOString(),
            });
            router.back();
        } catch (e) {
            Alert.alert('Error', 'Could not save target');
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
                <Text style={styles.title}>New Target</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView contentContainerStyle={styles.form}>
                <Text style={styles.label}>Period</Text>
                <View style={styles.toggle}>
                    <TouchableOpacity
                        style={[styles.toggleBtn, period === 'weekly' && styles.toggleActive]}
                        onPress={() => setPeriod('weekly')}
                    >
                        <Text style={[styles.toggleText, period === 'weekly' && styles.toggleTextActive]}>Weekly</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleBtn, period === 'monthly' && styles.toggleActive]}
                        onPress={() => setPeriod('monthly')}
                    >
                        <Text style={[styles.toggleText, period === 'monthly' && styles.toggleTextActive]}>Monthly</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.label}>Category (optional)</Text>
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
                            style={[styles.catChip, selectedCat === cat.id && styles.catChipActive]}
                            onPress={() => setSelectedCat(cat.id)}
                        >
                            <Text style={[styles.catChipText, selectedCat === cat.id && styles.catChipTextActive]}>
                                {cat.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <Text style={styles.label}>Number of sessions</Text>
                <TextInput
                    style={styles.input}
                    value={targetValue}
                    onChangeText={setTargetValue}
                    placeholder="e.g. 4"
                    placeholderTextColor={Colors.textDim}
                    keyboardType="numeric"
                    accessibilityLabel="Target sessions input"
                />

                <TouchableOpacity
                    style={[styles.btn, loading && styles.btnDisabled]}
                    onPress={handleSave}
                    disabled={loading}
                    accessibilityLabel="Save target"
                >
                    <Text style={styles.btnText}>{loading ? 'Saving...' : 'Save Target'}</Text>
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
    toggle: { flexDirection: 'row', backgroundColor: Colors.card, borderRadius: Radius.md, padding: 4, marginBottom: Spacing.md },
    toggleBtn: { flex: 1, padding: Spacing.sm, alignItems: 'center', borderRadius: Radius.sm },
    toggleActive: { backgroundColor: Colors.primary },
    toggleText: { color: Colors.textMuted, fontWeight: '600', fontSize: Fonts.sizes.sm },
    toggleTextActive: { color: Colors.background },
    catRow: { marginBottom: Spacing.md },
    catChip: { borderWidth: 1, borderColor: Colors.cardBorder, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, marginRight: Spacing.sm, backgroundColor: Colors.card },
    catChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    catChipText: { color: Colors.text, fontSize: Fonts.sizes.sm, fontWeight: '600' },
    catChipTextActive: { color: Colors.background },
    input: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.cardBorder, borderRadius: Radius.md, padding: Spacing.md, color: Colors.text, fontSize: Fonts.sizes.md, marginBottom: Spacing.sm },
    btn: { backgroundColor: Colors.primary, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', marginTop: Spacing.md },
    btnDisabled: { opacity: 0.6 },
    btnText: { color: Colors.background, fontWeight: '800', fontSize: Fonts.sizes.md },
});
