import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    SafeAreaView,
    StatusBar,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BLUE_PRIMARY = '#1C2C5B';
const WHITE = '#FFFFFF';

export default function AturJadwalPoinScreen({ navigation }) {
    const [schools, setSchools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [massAmount, setMassAmount] = useState('');
    const [massDay, setMassDay] = useState('');

    useEffect(() => {
        fetchSchools();
    }, []);

    const fetchSchools = async () => {
        try {
            const userDataStr = await AsyncStorage.getItem('user_data');
            const userData = userDataStr ? JSON.parse(userDataStr) : null;
            
            if (!userData || !userData.sppg_id) return;

            const response = await apiClient.get(`sppg/sppg_get_sekolah.php?sppg_id=${userData.sppg_id}`);
            if (response.data && response.data.status === 'success') {
                // Tambahkan field amount untuk input lokal
                const data = response.data.data.map(s => ({
                    ...s,
                    monthly_amount: s.monthly_amount ? String(s.monthly_amount) : '0',
                    distribution_day: s.distribution_day ? String(s.distribution_day) : '1',
                    is_distributed: s.last_distributed && s.last_distributed.startsWith(new Date().toISOString().slice(0, 7))
                }));
                setSchools(data);
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Gagal mengambil daftar sekolah.");
        } finally {
            setLoading(false);
        }
    };

    const updateAmount = (id, text) => {
        setSchools(prev => prev.map(s => s.id === id ? { ...s, monthly_amount: text } : s));
    };

    const updateDay = (id, text) => {
        const day = parseInt(text);
        if (day > 31) return;
        setSchools(prev => prev.map(s => s.id === id ? { ...s, distribution_day: text } : s));
    };

    const applyMassUpdate = () => {
        if (!massAmount && !massDay) {
            Alert.alert("Input Kosong", "Isi nominal atau tanggal untuk update massal.");
            return;
        }
        setSchools(prev => prev.map(s => ({
            ...s,
            monthly_amount: massAmount || s.monthly_amount,
            distribution_day: massDay || s.distribution_day
        })));
        Alert.alert("Berhasil", "Data massal telah diterapkan ke daftar (Klik simpan pada masing-masing sekolah).");
    };

    const saveSchedule = async (school) => {
        setSubmitting(true);
        try {
            const payload = {
                sekolah_id: school.id,
                monthly_amount: parseFloat(school.monthly_amount) || 0,
                distribution_day: parseInt(school.distribution_day) || 1
            };
            
            // 1. Simpan Jadwal ke Database
            const response = await apiClient.post('sppg/set_scheduled_points.php', payload);
            
            if (response.data.status === 'success') {
                const today = new Date().getDate();
                
                // 2. Jika tanggal distribusi adalah HARI INI atau SUDAH LEWAT, langsung picu pengiriman
                if (parseInt(school.distribution_day) <= today) {
                    setSubmitting(true); // Tampilkan loading lagi untuk proses distribusi
                    const distResponse = await apiClient.get('sppg/process_monthly_points.php');
                    
                    if (distResponse.data.status === 'success') {
                        Alert.alert("Distribusi Berhasil", `Jadwal disimpan dan Poin langsung dikirim secara real-time ke ${school.nama_sekolah}!`);
                    } else if (distResponse.data.status === 'error') {
                        Alert.alert("Gagal Distribusi Otomatis", distResponse.data.message || "Gagal memproses pengiriman bulan ini.");
                    } else {
                        Alert.alert("Jadwal Tersimpan", "Jadwal berhasil diperbarui. Poin akan dikirim otomatis oleh sistem pada tanggal tersebut.");
                    }
                } else {
                    Alert.alert("Berhasil", `Jadwal diperbarui. Poin akan otomatis dikirim pada tanggal ${school.distribution_day} bulan ini.`);
                }
                
                // Refresh data untuk update UI (Checklist Hijau)
                fetchSchools();
            } else {
                Alert.alert("Gagal Menyimpan Jadwal", response.data.message || "Terjadi kesalahan pada database.");
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Gagal melakukan sinkronisasi real-time.");
        } finally {
            setSubmitting(false);
        }
    };

    const showHistory = (school) => {
        if (!school.last_distributed) {
            Alert.alert("Informasi", "Belum ada riwayat distribusi untuk sekolah ini.");
            return;
        }
        
        // Format tanggal distribusi
        const date = new Date(school.last_distributed);
        const formattedDate = date.toLocaleDateString('id-ID', { 
            day: 'numeric', month: 'long', year: 'numeric' 
        });

        Alert.alert(
            "Riwayat Distribusi",
            `Sekolah: ${school.nama_sekolah}\n` +
            `Terakhir Dikirim: ${formattedDate}\n` +
            `Jumlah Poin: ${school.monthly_amount} PTS\n\n` +
            `Status: Sukses (Bulan ini sudah terdistribusi)`
        );
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.schoolName}>{item.nama_sekolah}</Text>
                    <Text style={styles.schoolAddress}>{item.npsn}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: item.is_distributed ? '#E3F9E5' : '#FFF4E5' }]}>
                    <Text style={[styles.statusText, { color: item.is_distributed ? '#1F9225' : '#B7791F' }]}>
                        {item.is_distributed ? 'Sudah Terkirim' : 'Menunggu Jadwal'}
                    </Text>
                </View>
            </View>

            <View style={styles.inputGrid}>
                <View style={styles.inputWrapper}>
                    <Text style={styles.inputLabel}>Jatah Poin</Text>
                    <View style={[styles.inputBox, item.is_distributed && { backgroundColor: '#F8F9FA' }]}>
                        <TextInput
                            style={styles.input}
                            keyboardType="numeric"
                            value={item.monthly_amount}
                            onChangeText={(text) => updateAmount(item.id, text)}
                            editable={!item.is_distributed}
                        />
                        <Text style={styles.unit}>PTS</Text>
                    </View>
                </View>
                <View style={styles.inputWrapper}>
                    <Text style={styles.inputLabel}>Tgl Kirim</Text>
                    <View style={[styles.inputBox, item.is_distributed && { backgroundColor: '#F8F9FA' }]}>
                        <Text style={styles.prefix}>Tgl</Text>
                        <TextInput
                            style={styles.inputSmall}
                            keyboardType="numeric"
                            maxLength={2}
                            value={item.distribution_day}
                            onChangeText={(text) => updateDay(item.id, text)}
                            editable={!item.is_distributed}
                        />
                    </View>
                </View>
                
                {item.is_distributed ? (
                    <TouchableOpacity 
                        style={[styles.saveBtn, { backgroundColor: '#1F9225' }]}
                        onPress={() => showHistory(item)}
                    >
                        <Ionicons name="checkmark-circle" size={24} color={WHITE} />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity 
                        style={styles.saveBtn}
                        onPress={() => saveSchedule(item)}
                    >
                        <Ionicons name="pencil" size={20} color={WHITE} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={BLUE_PRIMARY} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Jadwal Distribusi Point</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.massUpdateContainer}>
                <View style={styles.massHeader}>
                    <Ionicons name="flash-outline" size={18} color={BLUE_PRIMARY} />
                    <Text style={styles.massTitle}>Update Cepat (Semua Sekolah)</Text>
                </View>
                <View style={styles.massRow}>
                    <View style={styles.massInputGroup}>
                        <Text style={styles.tinyLabel}>NOMINAL POIN</Text>
                        <TextInput 
                            style={styles.massInput} 
                            placeholder="0" 
                            keyboardType="numeric" 
                            value={massAmount}
                            onChangeText={setMassAmount}
                        />
                    </View>
                    <View style={[styles.massInputGroup, { flex: 0.6 }]}>
                        <Text style={styles.tinyLabel}>TGL</Text>
                        <TextInput 
                            style={styles.massInput} 
                            placeholder="1" 
                            keyboardType="numeric" 
                            maxLength={2}
                            value={massDay}
                            onChangeText={setMassDay}
                        />
                    </View>
                    <TouchableOpacity style={styles.applyBtn} onPress={applyMassUpdate}>
                        <Ionicons name="sync" size={20} color={WHITE} />
                    </TouchableOpacity>
                </View>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={BLUE_PRIMARY} style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={schools}
                    renderItem={renderItem}
                    keyExtractor={item => (item.id || Math.random()).toString()}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={<Text style={styles.emptyText}>Tidak ada data sekolah.</Text>}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0F2F5',
        paddingTop: Platform.OS === 'android' ? 10 : 0, // Memberikan jarak aman di atas
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 20,
        backgroundColor: WHITE,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 8,
        zIndex: 10,
    },
    headerTitle: {
        fontSize: 19,
        fontWeight: '900',
        color: BLUE_PRIMARY,
        letterSpacing: 0.5,
    },
    backBtn: { 
        padding: 8,
        backgroundColor: '#F1F3F5',
        borderRadius: 12,
    },
    massUpdateContainer: {
        backgroundColor: WHITE,
        padding: 20,
        marginHorizontal: 15,
        marginTop: 20,
        marginBottom: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(28, 44, 91, 0.1)',
        shadowColor: BLUE_PRIMARY,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 2,
    },
    massHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    massTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: '#4A5568',
        marginLeft: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    massRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    massInputGroup: {
        flex: 1,
        marginRight: 10,
    },
    tinyLabel: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#A0AEC0',
        marginBottom: 5,
        marginLeft: 4,
    },
    massInput: {
        height: 48,
        backgroundColor: '#F7FAFC',
        borderRadius: 12,
        paddingHorizontal: 15,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        fontSize: 16,
        fontWeight: 'bold',
        color: BLUE_PRIMARY,
    },
    applyBtn: {
        backgroundColor: BLUE_PRIMARY,
        width: 50,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: BLUE_PRIMARY,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    listContent: { 
        paddingHorizontal: 15, 
        paddingTop: 10,
        paddingBottom: 50 
    },
    card: {
        backgroundColor: WHITE,
        borderRadius: 22,
        padding: 20,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#F1F3F5',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    schoolName: { 
        fontSize: 17, 
        fontWeight: 'bold', 
        color: '#1A202C',
        marginBottom: 4
    },
    schoolAddress: { 
        fontSize: 12, 
        color: '#718096',
        fontWeight: '600'
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusText: { 
        fontSize: 10, 
        fontWeight: '800',
        textTransform: 'uppercase' 
    },
    inputGrid: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    inputWrapper: { 
        flex: 1, 
        marginRight: 12 
    },
    inputLabel: { 
        fontSize: 10, 
        fontWeight: '800',
        color: '#A0AEC0', 
        marginBottom: 8,
        textTransform: 'uppercase',
        marginLeft: 2
    },
    inputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 14,
        paddingHorizontal: 15,
        height: 52,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    input: { 
        flex: 1, 
        fontSize: 16, 
        fontWeight: 'bold', 
        color: BLUE_PRIMARY 
    },
    inputSmall: { 
        fontSize: 16, 
        fontWeight: 'bold', 
        color: BLUE_PRIMARY, 
        width: 30 
    },
    unit: { 
        fontSize: 10, 
        fontWeight: 'bold',
        color: '#718096' 
    },
    prefix: { 
        fontSize: 10, 
        fontWeight: 'bold',
        color: '#718096', 
        marginRight: 5 
    },
    saveBtn: {
        backgroundColor: BLUE_PRIMARY,
        width: 52,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: BLUE_PRIMARY,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    emptyText: { textAlign: 'center', marginTop: 50, color: '#718096', fontWeight: '600' }
});
