import { Colors, Fonts } from '@/constants/theme';
import { StyleSheet, Text, View } from 'react-native';

export default function TargetsScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Targets</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' },
    text: { color: Colors.text, fontSize: Fonts.sizes.xl },
});
