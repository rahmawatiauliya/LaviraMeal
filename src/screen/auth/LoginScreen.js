import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    SafeAreaView,
    Alert,
    ActivityIndicator,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BLUE_PRIMARY = '#1C2C5B';
const BLUE_DARK = '#1C2C5B';
const BLUE_LIGHT = '#6995B9';
const BLUE_BG_PATTERN = 'rgba(255,255,255,0.08)';
const WHITE = '#FFFFFF';

export default function LoginScreen({ navigation }) {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!identifier || !password) {
            Alert.alert('Error', 'Silakan isi username dan password');
            return;
        }

        setLoading(true);
        try {
            const response = await apiClient.post('auth/login.php', {
                identifier: identifier,
                password: password
            });

            if (response.data.status === 'success') {
                // Berhasil login, cek role & save data
                const userData = response.data.user;
                const userRole = userData?.role;
                await AsyncStorage.setItem('user_data', JSON.stringify(userData));

                if (userRole === 'sekolah') {
                    navigation.replace('HomeSekolah');
                } else if (userRole === 'siswa') {
                    navigation.replace('HomeSiswa');
                } else if (userRole === 'guru') {
                    navigation.replace('HomeGuru');
                } else if (userRole === 'kantin') {
                    navigation.replace('HomeKantin');
                } else {
                    navigation.replace('Home');
                }
            } else {
                Alert.alert('Gagal', response.data.message || 'Username atau password salah');
            }
        } catch (error) {
            console.error('Login Error:', error);
            const responseData = error.response?.data;
            const errorMsg = responseData?.message || responseData?.detail || 'Tidak dapat terhubung ke server';
            Alert.alert('Error', errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {/* Header Section */}
            <View style={styles.headerSection}>
                <Image
                    source={require('../../../assets/batik_cirebon.png')}
                    style={[StyleSheet.absoluteFillObject, { opacity: 0.08, resizeMode: 'repeat' }]}
                />
                {/* Efek Gradasi dihapus agar batik terlihat sampai bawah header */}
                <View style={[styles.headerTextContainer, { height: 160, justifyContent: 'center' }]}>
                    <Text style={styles.logoTextMain}>
                        Lavira<Text style={styles.logoTextSub}>Meal</Text>
                    </Text>
                    <View style={styles.logoBadge}>
                        <Text style={styles.logoBadgeText}>APPS</Text>
                    </View>
                </View>
            </View>

            {/* Form Section */}
            <View style={styles.formCard}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    <Text style={styles.formTitle}>Masuk Akun</Text>
                    <Text style={styles.formSubtitle}>Silakan login untuk melanjutkan layanan</Text>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Username</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="person-outline" size={20} color="#AAB8C2" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Masukkan Username atau Email"
                                placeholderTextColor="#AAB8C2"
                                value={identifier}
                                onChangeText={setIdentifier}
                                autoCapitalize="none"
                            />
                        </View>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Kata Sandi</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="lock-closed-outline" size={20} color="#AAB8C2" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Isi Kata Sandi"
                                placeholderTextColor="#AAB8C2"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#AAB8C2" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.forgotPassword}
                        onPress={() => navigation.navigate('ForgotPassword')}
                    >
                        <Text style={styles.forgotPasswordText}>Lupa Sandi?</Text>
                    </TouchableOpacity>

                    <View style={styles.footerInfo}>
                        <Text style={styles.footerText}>Belum punya akun? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Login1')}>
                            <Text style={styles.registerLink}>Daftar Sekarang</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={styles.mainButton}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={WHITE} />
                        ) : (
                            <Text style={styles.mainButtonText}>Masuk Sekarang</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BLUE_PRIMARY,
    },
    headerSection: {
        backgroundColor: BLUE_PRIMARY,
        paddingTop: 80,
        paddingBottom: 60,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
        position: 'relative',
    },
    headerTextContainer: {
        alignItems: 'center',
        zIndex: 2,
    },
    logoTextMain: {
        color: WHITE,
        fontSize: 46,
        fontWeight: '900',
        letterSpacing: 1.5,
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.25)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 10,
    },
    logoTextSub: {
        color: WHITE,
        fontSize: 46,
        fontWeight: '900',
        letterSpacing: 1.5,
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.25)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 10, // Light sky blue to give a premium glow
    },
    logoBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
        marginTop: 6,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    logoBadgeText: {
        color: WHITE,
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 4,
        opacity: 0.9,
    },
    formCard: {
        flex: 1,
        backgroundColor: WHITE,
        borderTopLeftRadius: 35,
        borderTopRightRadius: 35,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 10,
        marginTop: -35,
    },
    scrollContent: {
        paddingHorizontal: 30,
        paddingTop: 35,
        paddingBottom: 40,
    },
    formTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginBottom: 4,
    },
    formSubtitle: {
        fontSize: 14,
        color: '#707070',
        marginBottom: 25,
    },
    formGroup: {
        marginBottom: 15,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.2,
        borderColor: '#E8ECEF',
        borderRadius: 15,
        paddingHorizontal: 15,
        height: 56,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.02,
        shadowRadius: 2,
        elevation: 1,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: '#1A1A1A',
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginTop: -5,
        marginBottom: 15,
    },
    forgotPasswordText: {
        color: BLUE_PRIMARY,
        fontSize: 14,
        fontWeight: '600',
    },
    footerInfo: {
        flexDirection: 'row',
        marginTop: 10,
        marginBottom: 30,
        justifyContent: 'center',
    },
    footerText: {
        fontSize: 14,
        color: '#636E72',
    },
    registerLink: {
        fontSize: 14,
        color: BLUE_PRIMARY,
        fontWeight: 'bold',
    },
    mainButton: {
        backgroundColor: BLUE_PRIMARY,
        height: 60,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: BLUE_PRIMARY,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 10,
    },
    mainButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
});

