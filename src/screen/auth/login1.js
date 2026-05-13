import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
    StatusBar, SafeAreaView, Alert, ActivityIndicator, Image, Animated, Dimensions, KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import apiClient from '../../api/client';

const { width } = Dimensions.get('window');

// Color Palettes
const THEMES = {
    DEFAULT: { primary: '#1C2C5B', accent: '#38BDF8', light: '#F1F5F9', text: '#1E293B' },
    KANTIN: { primary: '#D97706', accent: '#F59E0B', light: '#FFFBEB', text: '#451A03' },
    SISWA: { primary: '#4F46E5', accent: '#818CF8', light: '#EEF2FF', text: '#1E1B4B' }
};

export default function Login1({ navigation }) {
    const [daftarSebagai, setDaftarSebagai] = useState('');
    const [theme, setTheme] = useState(THEMES.DEFAULT);
    
    // Form States
    const [nama, setNama] = useState('');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    // UI States
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Animation values
    const fadeAnim = useState(new Animated.Value(1))[0];

    useEffect(() => {
        let newTheme = THEMES.DEFAULT;
        if (daftarSebagai === 'Kantin') newTheme = THEMES.KANTIN;
        if (daftarSebagai === 'Siswa') newTheme = THEMES.SISWA;
        
        Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
            setTheme(newTheme);
            Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();
        });
    }, [daftarSebagai]);

    const handleNext = async () => {
        if (!daftarSebagai) {
            Alert.alert('Pilih Peran', 'Harap pilih peran pendaftaran Anda terlebih dahulu.');
            return;
        }

        const role = daftarSebagai.toLowerCase();

        if (role === 'sppg') {
            navigation.navigate('RegisterScreen');
        } else if (role === 'guru') {
            navigation.navigate('RegisterGuruScreen');
        } else {
            if (!nama || !username || !email || !password || !confirmPassword) {
                Alert.alert('Data Tidak Lengkap', 'Semua kolom wajib diisi untuk pendaftaran ' + daftarSebagai);
                return;
            }

            if (password !== confirmPassword) {
                Alert.alert('Kesalahan', 'Konfirmasi kata sandi tidak cocok.');
                return;
            }

            setLoading(true);
            try {
                const response = await apiClient.post('auth/register.php', {
                    nama_lengkap: nama,
                    username: username,
                    email: email,
                    password: password,
                    role: role,
                });

                if (response.data.status === 'success') {
                    Alert.alert('Sukses', 'Registrasi ' + daftarSebagai + ' berhasil! Silakan login.', [
                        { text: 'Login Sekarang', onPress: () => navigation.navigate('Login') }
                    ]);
                } else {
                    Alert.alert('Gagal', response.data.message || 'Terjadi kesalahan teknis.');
                }
            } catch (error) {
                Alert.alert('Error', error.response?.data?.message || 'Tidak dapat terhubung ke server');
            } finally {
                setLoading(false);
            }
        }
    };

    const RoleOption = ({ label, icon, roleName }) => (
        <TouchableOpacity 
            style={[styles.roleItem, daftarSebagai === roleName && { backgroundColor: theme.primary, borderColor: theme.primary }]}
            onPress={() => {
                setDaftarSebagai(roleName);
                setMenuOpen(false);
            }}
        >
            <MaterialCommunityIcons 
                name={icon} 
                size={22} 
                color={daftarSebagai === roleName ? '#FFF' : theme.primary} 
            />
            <Text style={[styles.roleText, daftarSebagai === roleName && { color: '#FFF' }]}>{label}</Text>
            {daftarSebagai === roleName && <Ionicons name="checkmark-circle" size={18} color="#FFF" />}
        </TouchableOpacity>
    );

    return (
        <KeyboardAvoidingView 
            style={[styles.container, { backgroundColor: theme.primary }]}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <Animated.View style={[styles.headerSection, { opacity: fadeAnim }]}>
                <Image
                    source={require('../../../assets/batik_cirebon.png')}
                    style={[StyleSheet.absoluteFillObject, { opacity: 0.1, resizeMode: 'repeat' }]}
                />
                <SafeAreaView style={styles.headerSafe}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <View style={styles.brandBox}>
                        <Text style={styles.brandName}>Lavira<Text style={{ color: 'rgba(255,255,255,0.6)' }}>Meal</Text></Text>
                        <View style={styles.badge}><Text style={styles.badgeText}>REGISTRATION</Text></View>
                    </View>
                </SafeAreaView>
            </Animated.View>

            <View style={[styles.formCard, { backgroundColor: theme.light }]}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
                    <Text style={[styles.greeting, { color: theme.text }]}>Bergabung Bersama Kami</Text>
                    <Text style={styles.subGreeting}>Silakan lengkapi data profil Anda di bawah ini</Text>

                    {/* ROLE SELECTOR */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.text }]}>Daftar Sebagai</Text>
                        <TouchableOpacity 
                            style={styles.selectorTrigger}
                            onPress={() => setMenuOpen(!menuOpen)}
                        >
                            <View style={styles.triggerIcon}>
                                <MaterialCommunityIcons 
                                    name={daftarSebagai === 'SPPG' ? 'shield-account' : daftarSebagai === 'Guru' ? 'school' : daftarSebagai === 'Kantin' ? 'store' : daftarSebagai === 'Siswa' ? 'account-student' : 'account-question'} 
                                    size={20} 
                                    color={theme.primary} 
                                />
                            </View>
                            <Text style={[styles.triggerText, !daftarSebagai && { color: '#AAB8C2' }]}>
                                {daftarSebagai || "Pilih Peran Pendaftaran"}
                            </Text>
                            <Ionicons name={menuOpen ? "chevron-up" : "chevron-down"} size={20} color={theme.primary} />
                        </TouchableOpacity>

                        {menuOpen && (
                            <View style={styles.roleDropdown}>
                                <RoleOption label="Admin Wilayah (SPPG)" roleName="SPPG" icon="shield-account" />
                                <RoleOption label="Guru Sekolah" roleName="Guru" icon="school" />
                                <RoleOption label="Pengelola Kantin" roleName="Kantin" icon="store" />
                                <RoleOption label="Siswa / Pelajar" roleName="Siswa" icon="account-student" />
                            </View>
                        )}
                    </View>

                    {/* DYNAMIC FORM */}
                    {(!daftarSebagai || (daftarSebagai !== 'SPPG' && daftarSebagai !== 'Guru')) && (
                        <Animated.View style={{ opacity: fadeAnim }}>
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: theme.text }]}>Nama Lengkap</Text>
                                <View style={styles.inputBox}>
                                    <Feather name="user" size={18} color={theme.primary} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.textInput}
                                        placeholder="Masukkan nama lengkap"
                                        value={nama}
                                        onChangeText={setNama}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: theme.text }]}>Email & Username</Text>
                                <View style={styles.rowInputs}>
                                    <View style={[styles.inputBox, { flex: 1, marginRight: 10 }]}>
                                        <TextInput
                                            style={styles.textInput}
                                            placeholder="Email"
                                            value={email}
                                            onChangeText={setEmail}
                                            autoCapitalize="none"
                                            keyboardType="email-address"
                                        />
                                    </View>
                                    <View style={[styles.inputBox, { flex: 0.8 }]}>
                                        <TextInput
                                            style={styles.textInput}
                                            placeholder="Username"
                                            value={username}
                                            onChangeText={setUsername}
                                            autoCapitalize="none"
                                        />
                                    </View>
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: theme.text }]}>Keamanan Akun</Text>
                                <View style={styles.inputBox}>
                                    <Feather name="lock" size={18} color={theme.primary} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.textInput}
                                        placeholder="Buat Password"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                    />
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                        <Feather name={showPassword ? "eye" : "eye-off"} size={18} color="#AAB8C2" />
                                    </TouchableOpacity>
                                </View>
                                <View style={[styles.inputBox, { marginTop: 10 }]}>
                                    <Feather name="shield" size={18} color={theme.primary} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.textInput}
                                        placeholder="Ulangi Password"
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        secureTextEntry={!showConfirm}
                                    />
                                    <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                                        <Feather name={showConfirm ? "eye" : "eye-off"} size={18} color="#AAB8C2" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </Animated.View>
                    )}

                    <View style={styles.loginHint}>
                        <Text style={{ color: '#64748B' }}>Sudah punya akun? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                            <Text style={{ color: theme.primary, fontWeight: '800' }}>Masuk di Sini</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[styles.mainButton, { backgroundColor: theme.primary, shadowColor: theme.primary }]}
                        onPress={handleNext}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <>
                                <Text style={styles.mainButtonText}>
                                    {daftarSebagai === 'SPPG' || daftarSebagai === 'Guru' ? 'Lanjutkan Pendaftaran' : 'Daftar Sekarang'}
                                </Text>
                                <Feather name="arrow-right" size={20} color="#FFF" />
                            </>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerSection: { height: 220, justifyContent: 'center', alignItems: 'center' },
    headerSafe: { width: '100%', paddingHorizontal: 25, alignItems: 'center' },
    backBtn: { alignSelf: 'flex-start', width: 44, height: 44, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
    brandBox: { alignItems: 'center', marginTop: 10 },
    brandName: { color: '#FFF', fontSize: 32, fontWeight: '900', letterSpacing: 1 },
    badge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginTop: 8 },
    badgeText: { color: '#FFF', fontSize: 10, fontWeight: '900', letterSpacing: 2 },

    formCard: { flex: 1, borderTopLeftRadius: 40, borderTopRightRadius: 40, marginTop: -30, elevation: 20 },
    scrollPadding: { padding: 30 },
    greeting: { fontSize: 24, fontWeight: '900', marginBottom: 6 },
    subGreeting: { fontSize: 14, color: '#64748B', marginBottom: 30 },

    inputGroup: { marginBottom: 20 },
    label: { fontSize: 12, fontWeight: '900', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
    selectorTrigger: { height: 60, backgroundColor: '#FFF', borderRadius: 18, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, borderWidth: 1.5, borderColor: '#E2E8F0' },
    triggerIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    triggerText: { flex: 1, fontSize: 15, fontWeight: '700', color: '#1E293B' },
    
    roleDropdown: { backgroundColor: '#FFF', borderRadius: 20, marginTop: 10, padding: 8, elevation: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
    roleItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 15, marginBottom: 4, gap: 12 },
    roleText: { flex: 1, fontSize: 14, fontWeight: '800', color: '#64748B' },

    inputBox: { height: 60, backgroundColor: '#FFF', borderRadius: 18, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, borderWidth: 1.5, borderColor: '#E2E8F0' },
    inputIcon: { marginRight: 15 },
    rowInputs: { flexDirection: 'row' },
    textInput: { flex: 1, fontSize: 15, fontWeight: '700', color: '#1E293B' },

    loginHint: { flexDirection: 'row', justifyContent: 'center', marginTop: 10, marginBottom: 25 },
    mainButton: { height: 64, borderRadius: 22, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, elevation: 12, shadowOpacity: 0.3, shadowRadius: 10 },
    mainButtonText: { color: '#FFF', fontSize: 16, fontWeight: '900' }
});
