import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { db } from '@/db/index';
import { users } from '@/db/schema';
import { seedDatabase } from '@/db/seed';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { eq } from 'drizzle-orm';
import { router } from 'expo-router';
import { useContext, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { AuthContext } from './_layout';

export default function RegisterScreen() {
    const auth = useContext(AuthContext);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!name || !email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }
        setLoading(true);
        try {
            const existing = await db
                .select()
                .from(users)
                .where(eq(users.email, email.toLowerCase().trim()));

            if (existing.length > 0) {
                Alert.alert('Error', 'An account with this email already exists');
                return;
            }

            const inserted = await db
                .insert(users)
                .values({
                    name: name.trim(),
                    email: email.toLowerCase().trim(),
                    password,
                    createdAt: new Date().toISOString(),
                })
                .returning();

            const u = inserted[0];
            await AsyncStorage.setItem('userId', u.id.toString());
            auth?.setUser({ id: u.id, name: u.name, email: u.email });
            await seedDatabase(u.id);
            router.replace('/(tabs)');
        } catch (e) {
            Alert.alert('Error', 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
                <View style={styles.header}>
                    <Text style={styles.logo}>💪</Text>
                    <Text style={styles.title}>LiftLog</Text>
                    <Text style={styles.subtitle}>Create your account</Text>
                </View>

                <View style={styles.form}>
                    <Text style={styles.label}>Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Your name"
                        placeholderTextColor={Colors.textDim}
                        value={name}
                        onChangeText={setName}
                        accessibilityLabel="Name input"
                    />

                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="you@example.com"
                        placeholderTextColor={Colors.textDim}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        accessibilityLabel="Email input"
                    />

                    <Text style={styles.label}>Password</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Min. 6 characters"
                        placeholderTextColor={Colors.textDim}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        accessibilityLabel="Password input"
                    />

                    <TouchableOpacity
                        style={[styles.btn, loading && styles.btnDisabled]}
                        onPress={handleRegister}
                        disabled={loading}
                        accessibilityLabel="Register button"
                    >
                        <Text style={styles.btnText}>{loading ? 'Creating...' : 'Create Account'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => router.push('/login')} style={styles.link}>
                        <Text style={styles.linkText}>
                            Already have an account? <Text style={styles.linkBold}>Log In</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    inner: { flexGrow: 1, justifyContent: 'center', padding: Spacing.lg },
    header: { alignItems: 'center', marginBottom: Spacing.xl },
    logo: { fontSize: 64, marginBottom: Spacing.sm },
    title: { fontSize: Fonts.sizes.xxxl, fontWeight: '800', color: Colors.primary, letterSpacing: -1 },
    subtitle: { fontSize: Fonts.sizes.md, color: Colors.textMuted, marginTop: Spacing.xs },
    form: { gap: Spacing.sm },
    label: { fontSize: Fonts.sizes.sm, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
    input: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.cardBorder, borderRadius: Radius.md, padding: Spacing.md, color: Colors.text, fontSize: Fonts.sizes.md, marginBottom: Spacing.sm },
    btn: { backgroundColor: Colors.primary, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', marginTop: Spacing.sm },
    btnDisabled: { opacity: 0.6 },
    btnText: { color: Colors.background, fontWeight: '800', fontSize: Fonts.sizes.md },
    link: { alignItems: 'center', marginTop: Spacing.md },
    linkText: { color: Colors.textMuted, fontSize: Fonts.sizes.sm },
    linkBold: { color: Colors.primary, fontWeight: '700' },
});
