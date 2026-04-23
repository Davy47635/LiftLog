import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
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
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { AuthContext } from '../_layout';

export default function ProfileScreen() {
    const auth = useContext(AuthContext);

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
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Profile</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {auth?.user?.name?.charAt(0).toUpperCase() ?? '?'}
                    </Text>
                </View>

                <Text style={styles.name}>{auth?.user?.name ?? 'Athlete'}</Text>
                <Text style={styles.email}>{auth?.user?.email ?? ''}</Text>

                <View style={styles.section}>
                    <TouchableOpacity
                        style={styles.btn}
                        onPress={handleLogout}
                        accessibilityLabel="Log out"
                    >
                        <Ionicons name="log-out-outline" size={20} color={Colors.text} />
                        <Text style={styles.btnText}>Log Out</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.btn, styles.btnDanger]}
                        onPress={handleDeleteAccount}
                        accessibilityLabel="Delete account"
                    >
                        <Ionicons name="trash-outline" size={20} color={Colors.danger} />
                        <Text style={[styles.btnText, styles.btnTextDanger]}>Delete Account</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background, paddingTop: 60 },
    header: { paddingHorizontal: Spacing.md, marginBottom: Spacing.lg },
    title: { fontSize: Fonts.sizes.xxl, fontWeight: '800', color: Colors.text },
    content: { alignItems: 'center', paddingHorizontal: Spacing.lg },
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md },
    avatarText: { fontSize: Fonts.sizes.xxxl, fontWeight: '800', color: Colors.background },
    name: { fontSize: Fonts.sizes.xl, fontWeight: '800', color: Colors.text, marginBottom: Spacing.xs },
    email: { fontSize: Fonts.sizes.md, color: Colors.textMuted, marginBottom: Spacing.xl },
    section: { width: '100%', gap: Spacing.sm },
    btn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.cardBorder },
    btnDanger: { borderColor: Colors.danger },
    btnText: { color: Colors.text, fontWeight: '600', fontSize: Fonts.sizes.md },
    btnTextDanger: { color: Colors.danger },
});
