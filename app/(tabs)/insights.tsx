import { Colors, Fonts } from '@/constants/theme';
import { StyleSheet, Text, View } from 'react-native';

export default function InsightsScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Insights</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' },
    text: { color: Colors.text, fontSize: Fonts.sizes.xl },
});
