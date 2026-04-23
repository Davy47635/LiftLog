import { DarkColors, LightColors } from '@/constants/theme';
import { db } from '@/db/index';
import { categories, users, workouts } from '@/db/schema';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { eq } from 'drizzle-orm';
import { router } from 'expo-router';
import { useContext, useEffect, useState } from 'react';
import {
    Alert,
    Share,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { AuthContext } from '../_layout';

export default function ProfileScreen() {
    const auth = useContext(AuthContext);
    const [isDark, setIsDark] = useState(true);

    useEffect(() => {
        AsyncStorage.getItem('theme').then((val) => {
            if (val === 'light') setIsDark(false);
        });
    }, []);

    const colors = isDark ? DarkColors : LightColors;

    const toggleTheme = async () => {
        const next = !isDark;
        setIsDark(next);
        await AsyncStorage.setItem('theme', next ? 'dark' : 'light');
    };

    const handleExportCSV = async () => {
        try {
            const stored = await AsyncStorage.getItem('userId');
            if (!stored) return;
            const userId = parseInt(stored);

            const rows = await db
                .select({
                    date: workouts.date,
                    durationMins: workouts.durationMins,
                    notes: workouts.notes,
                    categoryName: categories.name,
                })
                .from(workouts)
                .innerJoin(categories, eq(workouts.categoryId, categories.id))
                .where(eq(workouts.userId, userId));

            const header = 'Date,Category,Duration (mins),Notes\n';
            const csvRows = rows.map((r) =>
                `${r.date},${r.categoryName},${r.durationMins},"${r.notes ?? ''}"`
            );
            const csv = header + csvRows.join('\n');

            await Share.share({
                message: csv,
                title: 'LiftLog Export',
            });
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Could not export data');
        }
    };

    const handleLogout = async () => {
        Alert.alert('Log Out', 'Are you sure you want to log out?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Log Out',
                style: 'destructive',
                onPress: async () => {
                    await AsyncStorage.removeItem('userId');
                    auth?.setUser(null);
                    router.replace('/login');
                },
            },
        ]);
    };

    const handleDeleteAccount = async () => {
        Alert.alert(
            'Delete Account',
            'This will permanently delete your account and all your data. Are you sure?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        if (!auth?.user) return;
                        await db.delete(users).where(eq(users.id, auth.user.id));
                        await AsyncStorage.removeItem('userId');
                        auth?.setUser(null);
                        router.replace('/register');
                    },
                },
            ]
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
            </View>

            <View style={styles.content}>
                <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.avatarText, { color: colors.background }]}>
                        {auth?.user?.name?.charAt(0).toUpperCase() ?? '?'}
                    </Text>
                </View>

                <Text style={[styles.name, { color: colors.text }]}>{auth?.user?.name ?? 'Athlete'}</Text>
                <Text style={[styles.email, { color: colors.textMuted }]}>{auth?.user?.email ?? ''}</Text>

                <View style={styles.section}>
                    <View style={[styles.btn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                        <Ionicons name={isDark ? 'moon-outline' : 'sunny-outline'} size={20} color={colors.text} />
                        <Text style={[styles.btnText, { color: colors.text, flex: 1 }]}>
                            {isDark ? 'Dark Mode' : 'Light Mode'}
                        </Text>
                        <Switch
                            value={isDark}
                            onValueChange={toggleTheme}
                            trackColor={{ false: colors.cardBorder, true: colors.primary }}
                            thumbColor={colors.background}
                            accessibilityLabel="Toggle dark mode"
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.btn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                        onPress={handleExportCSV}
                        accessibilityLabel="Export CSV"
                    >
                        <Ionicons name="download-outline" size={20} color={colors.text} />
                        <Text style={[styles.btnText, { color: colors.text }]}>Export Workouts CSV</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.btn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                        onPress={handleLogout}
                        accessibilityLabel="Log out"
                    >
                        <Ionicons name="log-out-outline" size={20} color={colors.text} />
                        <Text style={[styles.btnText, { color: colors.text }]}>Log Out</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.btn, { backgroundColor: colors.card, borderColor: colors.danger }]}
                        onPress={handleDeleteAccount}
                        accessibilityLabel="Delete account"
                    >
                        <Ionicons name="trash-outline" size={20} color={colors.danger} />
                        <Text style={[styles.btnText, { color: colors.danger }]}>Delete Account</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 60 },
    header: { paddingHorizontal: 16, marginBottom: 24 },
    title: { fontSize: 28, fontWeight: '800' },
    content: { alignItems: 'center', paddingHorizontal: 24 },
    avatar: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    avatarText: { fontSize: 36, fontWeight: '800' },
    name: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
    email: { fontSize: 15, marginBottom: 32 },
    section: { width: '100%', gap: 8 },
    btn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, padding: 16, borderWidth: 1 },
    btnText: { fontWeight: '600', fontSize: 15 },
});
