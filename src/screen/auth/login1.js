import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    StatusBar, SafeAreaView, Image, Animated, Dimensions
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const BLUE_PRIMARY = '#0B1E3F';
const GOLD = '#F59E0B';
const WHITE = '#FFFFFF';
const SOFT_BG = '#F8FAFC';
const TEXT_MAIN = '#1E293B';
const TEXT_MUTED = '#64748B';

export default function Login1({ navigation }) {
    const fadeAnim = useState(new Animated.Value(0))[0];
    const slideAnim = useState(new Animated.Value(30))[0];

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true })
        ]).start();
    }, []);

    const RoleCard = ({ title, sub, icon, color, onPress }) => (
        <TouchableOpacity
            style={styles.roleCard}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
                <MaterialCommunityIcons name={icon} size={32} color={color} />
            </View>
            <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{title}</Text>
                <Text style={styles.cardSub}>{sub}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={TEXT_MUTED} />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <View style={styles.headerSection}>
                <Image
                    source={require('../../../assets/batik_cirebon.png')}
                    style={[StyleSheet.absoluteFillObject, { opacity: 0.1, resizeMode: 'repeat' }]}
                />
                <SafeAreaView style={styles.headerSafe}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color={WHITE} />
                    </TouchableOpacity>
                    <View style={styles.brandBox}>
                        <Text style={styles.brandName}>Lavira<Text style={{ color: 'rgba(255,255,255,0.6)' }}>Meal</Text></Text>
                        <Text style={styles.brandTag}>SISTEM MANAJEMEN GIZI TERPADU</Text>
                    </View>
                </SafeAreaView>
            </View>

            <Animated.View style={[styles.contentArea, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                <View style={styles.textGroup}>
                    <Text style={styles.greeting}>Pilih Peran Anda</Text>
                    <Text style={styles.subGreeting}>Silakan pilih jenis akun yang ingin Anda daftarkan</Text>
                </View>

                <View style={styles.cardsWrapper}>
                    <RoleCard
                        title="Admin Wilayah (SPPG)"
                        sub="Kelola data sekolah dan distribusi wilayah"
                        icon="shield-account"
                        color="#1C2C5B"
                        onPress={() => navigation.navigate('RegisterSppg')}
                    />

                    <RoleCard
                        title="Pengelola Kantin"
                        sub="Kelola menu sehat dan transaksi harian"
                        icon="store"
                        color="#D97706"
                        onPress={() => navigation.navigate('RegisterKantin')}
                    />
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Sudah memiliki akun? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.loginLink}>Masuk Sekarang</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: BLUE_PRIMARY },
    headerSection: { height: 260, justifyContent: 'center' },
    headerSafe: { paddingHorizontal: 30 },
    backBtn: { width: 44, height: 44, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
    brandBox: { marginTop: 25 },
    brandName: { color: WHITE, fontSize: 36, fontWeight: '900', letterSpacing: 1 },
    brandTag: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '800', letterSpacing: 2, marginTop: 5 },

    contentArea: { flex: 1, backgroundColor: WHITE, borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 30 },
    textGroup: { marginBottom: 35 },
    greeting: { fontSize: 26, fontWeight: '900', color: TEXT_MAIN },
    subGreeting: { fontSize: 14, color: TEXT_MUTED, marginTop: 5 },

    cardsWrapper: { gap: 20 },
    roleCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: WHITE,
        padding: 20,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10
    },
    iconContainer: { width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    cardInfo: { flex: 1, marginLeft: 20 },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: TEXT_MAIN },
    cardSub: { fontSize: 12, color: TEXT_MUTED, marginTop: 4, lineHeight: 18 },

    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 'auto', marginBottom: 20 },
    footerText: { color: TEXT_MUTED, fontSize: 14 },
    loginLink: { color: BLUE_PRIMARY, fontSize: 14, fontWeight: 'bold' }
});
