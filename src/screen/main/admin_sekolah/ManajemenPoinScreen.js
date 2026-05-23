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
    RefreshControl
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import apiClient from '../../../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BLUE_PRIMARY = '#0B1E3F';
const BLUE_DARK = '#0F172A';
const WHITE = '#FFFFFF';
const GOLD = '#D4AF37';

export default function ManajemenPoinScreen({ navigation }) {
    const [activeTab, setActiveTab] = useState('kelas'); // 'kelas' or 'guru'
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [massAmount, setMassAmount] = useState('');
    const [massDay, setMassDay] = useState('');
    const [sekolahId, setSekolahId] = useState(null);

    useEffect(() => {
        init();
    }, [activeTab]);

    const init = async () => {
        setLoading(true);
        const userDataStr = await AsyncStorage.getItem('user_data');
        const userData = userDataStr ? JSON.parse(userDataStr) : null;
        if (userData) {
            setSekolahId(userData.sekolah_id);
            fetchData(userData.sekolah_id);
        }
    };

    const fetchData = async (id) => {
        try {
            const endpoint = activeTab === 'kelas' ? 'sekolah/sekolah_get_kelas.php' : 'sekolah/sekolah_get_guru.php';
            const response = await apiClient.get(`${endpoint}?sekolah_id=${id}`);
            
            if (response.data && response.data.status === 'success') {
                const rawData = response.data.data.map(item => ({
                    ...item,
                    monthly_amount: item.monthly_amount ? String(item.monthly_amount) : '0',
                    distribution_day: item.distribution_day ? String(item.distribution_day) : '1',
                    is_distributed: item.last_distributed && item.last_distributed.startsWith(new Date().toISOString().slice(0, 7))
                }));
                setData(rawData);
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Gagal mengambil data.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchData(sekolahId);
    };

    const updateAmount = (id, text) => {
        setData(prev => prev.map(item => item.id === id ? { ...item, monthly_amount: text } : item));
    };

    const updateDay = (id, text) => {
        const day = parseInt(text);
        if (day > 31) return;
        setData(prev => prev.map(item => item.id === id ? { ...item, distribution_day: text } : item));
    };

    const applyMassUpdate = () => {
        if (!massAmount && !massDay) {
            Alert.alert("Input Kosong", "Isi nominal atau tanggal untuk update massal.");
            return;
        }
        setData(prev => prev.map(item => ({
            ...item,
            monthly_amount: massAmount || item.monthly_amount,
            distribution_day: massDay || item.distribution_day
        })));
        Alert.alert("Berhasil", "Data massal telah diterapkan ke daftar. Jangan lupa tekan Simpan pada masing-masing item.");
    };

    const saveSchedule = async (item) => {
        try {
            const payload = {
                sekolah_id: sekolahId,
                type: activeTab, // 'kelas' or 'guru'
                target_id: item.id,
                monthly_amount: parseFloat(item.monthly_amount) || 0,
                distribution_day: parseInt(item.distribution_day) || 1
            };
            
            // Menggunakan endpoint baru untuk menyimpan jadwal distribusi sekolah ke internal
            const response = await apiClient.post('sekolah/sekolah_set_scheduled_points.php', payload);
            
            if (response.data.status === 'success') {
                const today = new Date().getDate();
                
                // Jika tanggal hari ini sesuai atau sudah lewat, tawarkan untuk distribusi langsung
                if (parseInt(item.distribution_day) <= today && !item.is_distributed) {
                    Alert.alert(
                        "Jadwal Tersimpan",
                        "Tanggal distribusi sudah masuk. Apakah ingin mengirim poin sekarang?",
                        [
                            { text: "Nanti saja", style: "cancel" },
                            { text: "Kirim Sekarang", onPress: () => processDistribution(item) }
                        ]
                    );
                } else {
                    Alert.alert("Berhasil", "Jadwal distribusi berhasil diperbarui.");
                }
                fetchData(sekolahId);
            }
        } catch (error) {
            Alert.alert("Error", error.response?.data?.message || "Gagal menyimpan jadwal.");
        }
    };

    const processDistribution = async (item) => {
        try {
            const response = await apiClient.post('sekolah/sekolah_process_single_distribution.php', {
                sekolah_id: sekolahId,
                type: activeTab,
                target_id: item.id
            });
            if (response.data.status === 'success') {
                Alert.alert("Sukses", response.data.message);
                fetchData(sekolahId);
            }
        } catch (error) {
            Alert.alert("Gagal", error.response?.data?.message || "Gagal memproses distribusi.");
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.entityName}>{activeTab === 'kelas' ? `Kelas ${item.kelas}` : item.nama}</Text>
                    <Text style={styles.entitySub}>{activeTab === 'kelas' ? `${item.jumlah_siswa} Siswa` : item.nip}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: item.is_distributed ? '#E3F9E5' : '#FFF4E5' }]}>
                    <Text style={[styles.statusText, { color: item.is_distributed ? '#1F9225' : '#B7791F' }]}>
                        {item.is_distributed ? 'Sudah Terkirim' : 'Menunggu Jadwal'}
                    </Text>
                </View>
            </View>

            <View style={styles.inputGrid}>
                <View style={styles.inputWrapper}>
                    <Text style={styles.inputLabel}>Nominal Poin</Text>
                    <View style={styles.inputBox}>
                        <TextInput
                            style={styles.input}
                            keyboardType="numeric"
                            value={item.monthly_amount}
                            onChangeText={(text) => updateAmount(item.id, text)}
                        />
                        <Text style={styles.unit}>PTS</Text>
                    </View>
                </View>
                <View style={styles.inputWrapper}>
                    <Text style={styles.inputLabel}>Tgl Distribusi</Text>
                    <View style={styles.inputBox}>
                        <Text style={styles.prefix}>Tgl</Text>
                        <TextInput
                            style={styles.inputSmall}
                            keyboardType="numeric"
                            maxLength={2}
                            value={item.distribution_day}
                            onChangeText={(text) => updateDay(item.id, text)}
                        />
                    </View>
                </View>
                
                <TouchableOpacity 
                    style={[styles.saveBtn, item.is_distributed && { backgroundColor: '#1F9225' }]}
                    onPress={() => saveSchedule(item)}
                >
                    <Ionicons name={item.is_distributed ? "checkmark-done" : "save-outline"} size={22} color={WHITE} />
                </TouchableOpacity>
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
                <Text style={styles.headerTitle}>Atur Distribusi Point</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* TABS */}
            <View style={styles.tabBar}>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'kelas' && styles.activeTab]}
                    onPress={() => setActiveTab('kelas')}
                >
                    <Text style={[styles.tabText, activeTab === 'kelas' && styles.activeTabText]}>Per Kelas</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'guru' && styles.activeTab]}
                    onPress={() => setActiveTab('guru')}
                >
                    <Text style={[styles.tabText, activeTab === 'guru' && styles.activeTabText]}>Per Guru</Text>
                </TouchableOpacity>
            </View>

            {/* MASS UPDATE SECTION */}
            <View style={styles.massUpdateContainer}>
                <View style={styles.massHeader}>
                    <Feather name="zap" size={16} color={BLUE_PRIMARY} />
                    <Text style={styles.massTitle}>Update Cepat (Semua {activeTab === 'kelas' ? 'Kelas' : 'Guru'})</Text>
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
                        <Ionicons name="save-outline" size={20} color={WHITE} />
                    </TouchableOpacity>
                </View>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={BLUE_PRIMARY} />
                    <Text style={styles.loadingText}>Memuat data...</Text>
                </View>
            ) : (
                <FlatList
                    data={data}
                    renderItem={renderItem}
                    keyExtractor={item => (item.id || Math.random()).toString()}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="folder-open-outline" size={60} color="#CBD5E1" />
                            <Text style={styles.emptyText}>Tidak ada data {activeTab}.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 20,
        backgroundColor: WHITE,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        elevation: 10,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    headerTitle: { fontSize: 18, fontWeight: '900', color: BLUE_PRIMARY },
    backBtn: { padding: 8, backgroundColor: '#F1F5F9', borderRadius: 12 },
    
    tabBar: { flexDirection: 'row', backgroundColor: '#E2E8F0', margin: 20, borderRadius: 15, padding: 5 },
    tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
    activeTab: { backgroundColor: WHITE, elevation: 2 },
    tabText: { fontSize: 14, fontWeight: 'bold', color: '#64748B' },
    activeTabText: { color: BLUE_PRIMARY },

    massUpdateContainer: { backgroundColor: WHITE, padding: 20, marginHorizontal: 20, marginBottom: 15, borderRadius: 24, elevation: 2 },
    massHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    massTitle: { fontSize: 12, fontWeight: '800', color: '#64748B', marginLeft: 8, textTransform: 'uppercase' },
    massRow: { flexDirection: 'row', alignItems: 'flex-end' },
    massInputGroup: { flex: 1, marginRight: 10 },
    tinyLabel: { fontSize: 9, fontWeight: 'bold', color: '#94A3B8', marginBottom: 5, marginLeft: 4 },
    massInput: { height: 48, backgroundColor: '#F8FAFC', borderRadius: 14, paddingHorizontal: 15, borderWidth: 1, borderColor: '#E2E8F0', fontSize: 16, fontWeight: 'bold', color: BLUE_PRIMARY },
    applyBtn: { backgroundColor: BLUE_PRIMARY, width: 50, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },

    listContent: { paddingHorizontal: 20, paddingBottom: 50 },
    card: { backgroundColor: WHITE, borderRadius: 24, padding: 20, marginBottom: 15, elevation: 3, shadowOpacity: 0.05 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    entityName: { fontSize: 16, fontWeight: 'bold', color: BLUE_DARK },
    entitySub: { fontSize: 12, color: '#64748B', marginTop: 2 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
    statusText: { fontSize: 9, fontWeight: '800' },

    inputGrid: { flexDirection: 'row', alignItems: 'flex-end' },
    inputWrapper: { flex: 1, marginRight: 12 },
    inputLabel: { fontSize: 10, fontWeight: 'bold', color: '#94A3B8', marginBottom: 8, textTransform: 'uppercase' },
    inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 14, paddingHorizontal: 15, height: 50, borderWidth: 1, borderColor: '#E2E8F0' },
    input: { flex: 1, fontSize: 15, fontWeight: 'bold', color: BLUE_PRIMARY },
    inputSmall: { fontSize: 15, fontWeight: 'bold', color: BLUE_PRIMARY, width: 30 },
    unit: { fontSize: 10, fontWeight: 'bold', color: '#94A3B8' },
    prefix: { fontSize: 10, fontWeight: 'bold', color: '#94A3B8', marginRight: 5 },
    saveBtn: { backgroundColor: BLUE_PRIMARY, width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
    loadingText: { marginTop: 10, color: '#64748B', fontWeight: '600' },
    emptyContainer: { alignItems: 'center', marginTop: 50 },
    emptyText: { marginTop: 15, color: '#94A3B8', fontWeight: 'bold' }
});
