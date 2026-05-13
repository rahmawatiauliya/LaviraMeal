import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Alert,
    ActivityIndicator,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../api/client';

const BLUE_PRIMARY = '#1C2C5B';
const WHITE = '#FFFFFF';

export default function ForgotPasswordScreen({ navigation }) {
    const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
    const [email, setEmail] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSendOTP = async () => {
        if (!email) {
            Alert.alert('Error', 'Silakan isi email Anda');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Alert.alert('Error', 'Format email tidak valid');
            return;
        }

        setLoading(true);
        try {
            const response = await apiClient.post('auth/forgot_password.php', {
                action: 'send_otp',
                email: email
            });

            if (response.data.status === 'success') {
                // Di lingkungan dev, kita tampilkan OTP-nya agar user bisa lanjut tanpa cek email
                const msg = response.data.debug_otp 
                    ? `${response.data.message}\n\n(DEBUG OTP: ${response.data.debug_otp})` 
                    : response.data.message;
                
                Alert.alert('Sukses', msg);
                setStep(2);
            } else {
                Alert.alert('Gagal', response.data.message);
            }
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Server error');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (!otpCode || otpCode.length < 6) {
            Alert.alert('Error', 'Masukkan 6 digit kode OTP');
            return;
        }

        setLoading(true);
        try {
            const response = await apiClient.post('auth/forgot_password.php', {
                action: 'verify_otp',
                email: email,
                code: otpCode
            });

            if (response.data.status === 'success') {
                setStep(3);
            } else {
                Alert.alert('Gagal', response.data.message);
            }
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Kode OTP salah');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!newPassword || !confirmPassword) {
            Alert.alert('Error', 'Silakan isi kata sandi baru');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'Konfirmasi kata sandi tidak cocok');
            return;
        }

        setLoading(true);
        try {
            const response = await apiClient.post('auth/forgot_password.php', {
                action: 'reset_password',
                email: email,
                code: otpCode,
                new_password: newPassword
            });

            if (response.data.status === 'success') {
                Alert.alert('Berhasil', 'Kata sandi telah diperbarui', [
                    { text: 'OK', onPress: () => navigation.navigate('Login') }
                ]);
            } else {
                Alert.alert('Gagal', response.data.message);
            }
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Gagal reset sandi');
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <>
                        <Text style={styles.formTitle}>Lupa Sandi?</Text>
                        <Text style={styles.formSubtitle}>Masukkan email terdaftar untuk menerima kode OTP</Text>
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Email</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="mail-outline" size={20} color="#AAB8C2" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="user@example.com"
                                    placeholderTextColor="#AAB8C2"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                            </View>
                        </View>
                        <TouchableOpacity style={styles.mainButton} onPress={handleSendOTP} disabled={loading}>
                            {loading ? <ActivityIndicator color={WHITE} /> : <Text style={styles.mainButtonText}>Kirim Kode</Text>}
                        </TouchableOpacity>
                    </>
                );
            case 2:
                return (
                    <>
                        <Text style={styles.formTitle}>Verifikasi OTP</Text>
                        <Text style={styles.formSubtitle}>Masukkan 6 digit kode yang dikirim ke {email}</Text>
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Kode OTP</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="keypad-outline" size={20} color="#AAB8C2" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter 6-digit code"
                                    placeholderTextColor="#AAB8C2"
                                    value={otpCode}
                                    onChangeText={setOtpCode}
                                    keyboardType="number-pad"
                                    maxLength={6}
                                    letterSpacing={5}
                                />
                            </View>
                        </View>
                        <TouchableOpacity style={styles.mainButton} onPress={handleVerifyOTP} disabled={loading}>
                            {loading ? <ActivityIndicator color={WHITE} /> : <Text style={styles.mainButtonText}>Verifikasi</Text>}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setStep(1)} style={styles.backLink}>
                            <Text style={styles.backLinkText}>Ganti Email</Text>
                        </TouchableOpacity>
                    </>
                );
            case 3:
                return (
                    <>
                        <Text style={styles.formTitle}>Kata Sandi Baru</Text>
                        <Text style={styles.formSubtitle}>Buat kata sandi yang kuat untuk keamanan Anda</Text>
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Kata Sandi Baru</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="lock-closed-outline" size={20} color="#AAB8C2" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Atur Sandi Baru"
                                    placeholderTextColor="#AAB8C2"
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#AAB8C2" />
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Konfirmasi Sandi</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="lock-closed-outline" size={20} color="#AAB8C2" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ulangi Sandi Baru"
                                    placeholderTextColor="#AAB8C2"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry={!showPassword}
                                />
                            </View>
                        </View>
                        <TouchableOpacity style={styles.mainButton} onPress={handleResetPassword} disabled={loading}>
                            {loading ? <ActivityIndicator color={WHITE} /> : <Text style={styles.mainButtonText}>Perbarui Sekarang</Text>}
                        </TouchableOpacity>
                    </>
                );
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <View style={styles.headerSection}>
                <Image
                    source={require('../../../assets/batik_cirebon.png')}
                    style={[StyleSheet.absoluteFillObject, { opacity: 0.08, resizeMode: 'repeat' }]}
                />
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={28} color={WHITE} />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.logoTextMain}>Lupa<Text style={styles.logoTextSub}> Sandi</Text></Text>
                </View>
            </View>

            <View style={styles.formCard}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {renderStep()}
                    <TouchableOpacity style={styles.footerLink} onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.footerText}>Ingat sandi? </Text>
                        <Text style={styles.loginLink}>Login</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: BLUE_PRIMARY },
    headerSection: { height: 220, justifyContent: 'center', alignItems: 'center', position: 'relative' },
    backButton: { position: 'absolute', top: 50, left: 20 },
    headerTextContainer: { alignItems: 'center' },
    logoTextMain: { color: WHITE, fontSize: 36, fontWeight: '900' },
    logoTextSub: { fontWeight: '300', color: '#BAE6FD' },
    formCard: { flex: 1, backgroundColor: WHITE, borderTopLeftRadius: 35, borderTopRightRadius: 35, marginTop: -35 },
    scrollContent: { paddingHorizontal: 30, paddingTop: 35, paddingBottom: 40 },
    formTitle: { fontSize: 24, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 4 },
    formSubtitle: { fontSize: 14, color: '#707070', marginBottom: 25 },
    formGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '700', color: '#1A1A1A', marginBottom: 8 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.2, borderColor: '#E8ECEF', borderRadius: 15, paddingHorizontal: 15, height: 56 },
    inputIcon: { marginRight: 12 },
    input: { flex: 1, fontSize: 15, color: '#1A1A1A' },
    mainButton: { backgroundColor: BLUE_PRIMARY, height: 60, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
    mainButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
    footerLink: { flexDirection: 'row', marginTop: 25, justifyContent: 'center' },
    footerText: { fontSize: 14, color: '#636E72' },
    loginLink: { fontSize: 14, color: BLUE_PRIMARY, fontWeight: 'bold' },
    backLink: { marginTop: 15, alignSelf: 'center' },
    backLinkText: { color: BLUE_PRIMARY, fontSize: 14, fontWeight: '600' },
});
