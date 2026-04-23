import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/constants/themecontext';
import { db } from '@/db/index';
import { users } from '@/db/schema';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { eq } from 'drizzle-orm';
import { router } from 'expo-router';
import { useContext } from 'react';
import {
    Alert,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { AuthContext } from '../_layout';

export default function ProfileScreen() {
    const auth = useContext(AuthContext);
    const { isDark, toggleTheme, colors } = useTheme();

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
                        onPress={handleLogout}
                        accessibilityLabel="Log out"
                    >
                        <Ionicons name="log-out-outline" size={20} color={colors.text} />
                        <Text style={[styles.btnText, { color: colors.text }]}>Log Out</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.btn, { backgroundColor: colors.card, borderColor: Colors.danger }]}
                        onPress={handleDeleteAccount}
                        accessibilityLabel="Delete account"
                    >
                        <Ionicons name="trash-outline" size={20} color={Colors.danger} />
                        <Text style={[styles.btnText, { color: Colors.danger }]}>Delete Account</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 60 },
    header: { paddingHorizontal: Spacing.md, marginBottom: Spacing.lg },
    title: { fontSize: Fonts.sizes.xxl, fontWeight: '800' },
    content: { alignItems: 'center', paddingHorizontal: Spacing.lg },
    avatar: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md },
    avatarText: { fontSize: Fonts.sizes.xxxl, fontWeight: '800' },
    name: { fontSize: Fonts.sizes.xl, fontWeight: '800', marginBottom: Spacing.xs },
    email: { fontSize: Fonts.sizes.md, marginBottom: Spacing.xl },
    section: { width: '100%', gap: Spacing.sm },
    btn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1 },
    btnText: { fontWeight: '600', fontSize: Fonts.sizes.md },
});
