import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    SafeAreaView,
    StatusBar,
    RefreshControl,
    Image,
    Modal,
    TextInput,
    Alert,
    ScrollView
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import apiClient, { IMAGE_BASE_URL } from '../../../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BLUE_PRIMARY = '#0F172A';
const WHITE = '#FFFFFF';
const GRAY_BG = '#F8FAFC';
const SUCCESS = '#10B981';
const ACCENT = '#3B82F6';

export default function MonitoringMenuScreen({ navigation }) {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState([]);
    const [user, setUser] = useState(null);
    const [selectedMenu, setSelectedMenu] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [sendingFeedback, setSendingFeedback] = useState(false);

    useEffect(() => {
        loadUserAndData();
    }, []);

    const loadUserAndData = async () => {
        setLoading(true);
        try {
            const userData = await AsyncStorage.getItem('user_data');
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);

            let url = 'admin/get_all_menu_harian.php';
            if (parsedUser.role === 'sekolah') {
                url += `?sekolah_id=${parsedUser.sekolah_id}`;
            }

            const response = await apiClient.get(url);
            if (response.data.status === 'success') {
                setData(response.data.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadUserAndData();
    };

    const handleGiveFeedback = async () => {
        if (!feedback) {
            Alert.alert('Peringatan', 'Harap isi feedback terlebih dahulu.');
            return;
        }

        try {
            setSendingFeedback(true);
            const response = await apiClient.post('admin/give_menu_feedback.php', {
                menu_id: selectedMenu.id,
                role: user.role, // sppg or sekolah
                feedback: feedback
            });

            if (response.data.status === 'success') {
                Alert.alert('Sukses', 'Feedback berhasil dikirim.');
                setModalVisible(false);
                setFeedback('');
                loadUserAndData();
            } else {
                Alert.alert('Gagal', response.data.message);
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Gagal mengirim feedback.');
        } finally {
            setSendingFeedback(false);
        }
    };

    const openDetail = (item) => {
        setSelectedMenu(item);
        setFeedback(user?.role === 'sppg' ? (item.feedback_sppg || '') : (item.feedback_sekolah || ''));
        setModalVisible(true);
    };

    const getStatusBadge = (item) => {
        const hasSppg = !!item.feedback_sppg;
        const hasSekolah = !!item.feedback_sekolah;
        
        let bgColor = '#F1F5F9';
        let textColor = '#475569';
        let statusText = 'Belum Dinilai';

        if (hasSppg && hasSekolah) {
            bgColor = '#D1FAE5';
            textColor = '#065F46';
            statusText = 'Selesai Evaluasi';
        } else if (hasSppg) {
            bgColor = '#DBEAFE';
            textColor = '#1E40AF';
            statusText = 'Dinilai SPPG';
        } else if (hasSekolah) {
            bgColor = '#FEF3C7';
            textColor = '#92400E';
            statusText = 'Dinilai Sekolah';
        }

        return (
            <View style={[styles.statusBadge, { backgroundColor: bgColor }]}>
                <Text style={[styles.statusBadgeTxt, { color: textColor }]}>{statusText}</Text>
            </View>
        );
    };

    const renderFeedbackLink = (item) => {
        const userHasGivenFeedback = user && (
            (user.role === 'sppg' && !!item.feedback_sppg) || 
            (user.role === 'sekolah' && !!item.feedback_sekolah)
        );

        if (userHasGivenFeedback) {
            return (
                <TouchableOpacity style={styles.detailLink} onPress={() => openDetail(item)}>
                    <Ionicons name="checkmark-circle" size={14} color={SUCCESS} />
                    <Text style={[styles.detailLinkText, { color: SUCCESS }]}>Sudah Dinilai</Text>
                    <Ionicons name="chevron-forward" size={14} color={SUCCESS} />
                </TouchableOpacity>
            );
        } else {
            return (
                <TouchableOpacity style={styles.detailLink} onPress={() => openDetail(item)}>
                    <Text style={styles.detailLinkText}>Beri Feedback</Text>
                    <Ionicons name="chevron-forward" size={14} color={ACCENT} />
                </TouchableOpacity>
            );
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.card}
            onPress={() => openDetail(item)}
        >
            <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.schoolName}>{item.nama_sekolah}</Text>
                    <Text style={styles.canteenName}>{item.nama_kantin}</Text>
                </View>
                <View style={{ flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <View style={styles.dateBadge}>
                        <Text style={styles.dateText}>{new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</Text>
                    </View>
                    {getStatusBadge(item)}
                </View>
            </View>
            
            <View style={styles.cardBody}>
                <View style={styles.menuInfo}>
                    <Text style={styles.menuName}>{item.nama_menu}</Text>
                    {item.deskripsi ? <Text style={styles.menuDesc} numberOfLines={2}>{item.deskripsi}</Text> : null}
                </View>
                {item.foto_menu && (
                    <Image 
                        source={{ uri: `${IMAGE_BASE_URL}${item.foto_menu}` }} 
                        style={styles.menuThumb} 
                    />
                )}
            </View>

            <View style={styles.cardFooter}>
                <View style={styles.feedbackStatus}>
                    <View style={styles.statusDot}>
                        <View style={[styles.dot, { backgroundColor: item.feedback_sppg ? SUCCESS : '#CBD5E1' }]} />
                        <Text style={styles.statusLabel}>SPPG</Text>
                    </View>
                    <View style={styles.statusDot}>
                        <View style={[styles.dot, { backgroundColor: item.feedback_sekolah ? SUCCESS : '#CBD5E1' }]} />
                        <Text style={styles.statusLabel}>Sekolah</Text>
                    </View>
                </View>
                {renderFeedbackLink(item)}
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={WHITE} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Pantau Menu Kantin</Text>
                <View style={{ width: 24 }} />
            </View>

            {loading && !refreshing ? (
                <View style={styles.loading}>
                    <ActivityIndicator size="large" color={BLUE_PRIMARY} />
                </View>
            ) : (
                <FlatList
                    data={data}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="food-off" size={64} color="#CBD5E1" />
                            <Text style={styles.emptyText}>Belum ada postingan menu harian</Text>
                        </View>
                    }
                />
            )}

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Detail Menu Harian</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
                            {selectedMenu && (
                                <>
                                    <Text style={styles.modalSchool}>{selectedMenu.nama_sekolah}</Text>
                                    <Text style={styles.modalCanteen}>{selectedMenu.nama_kantin}</Text>
                                    
                                    <View style={styles.modalDateBox}>
                                        <Ionicons name="calendar-outline" size={16} color={ACCENT} />
                                        <Text style={styles.modalDate}>{new Date(selectedMenu.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</Text>
                                    </View>

                                    <Text style={styles.sectionLabel}>Menu Makanan</Text>
                                    <Text style={styles.modalMenuName}>{selectedMenu.nama_menu}</Text>
                                    {selectedMenu.deskripsi ? <Text style={styles.modalMenuDesc}>{selectedMenu.deskripsi}</Text> : null}

                                    {selectedMenu.foto_menu && (
                                        <Image 
                                            source={{ uri: `${IMAGE_BASE_URL}${selectedMenu.foto_menu}` }} 
                                            style={styles.modalImage} 
                                            resizeMode="cover"
                                        />
                                    )}

                                    <Text style={styles.sectionLabel}>Beri Feedback Gizi/Kualitas</Text>
                                    <TextInput
                                        style={styles.feedbackInput}
                                        placeholder="Berikan saran atau evaluasi untuk menu ini..."
                                        multiline
                                        value={feedback}
                                        onChangeText={setFeedback}
                                    />
                                    
                                    <TouchableOpacity 
                                        style={[styles.submitBtn, sendingFeedback && { opacity: 0.7 }]} 
                                        onPress={handleGiveFeedback}
                                        disabled={sendingFeedback}
                                    >
                                        {sendingFeedback ? (
                                            <ActivityIndicator color={WHITE} />
                                        ) : (
                                            <Text style={styles.submitBtnText}>
                                                {user && ((user.role === 'sppg' && selectedMenu?.feedback_sppg) || (user.role === 'sekolah' && selectedMenu?.feedback_sekolah)) ? 'Perbarui Feedback' : 'Simpan Feedback'}
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                </>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: GRAY_BG },
    header: {
        backgroundColor: BLUE_PRIMARY,
        height: 110,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 50,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        elevation: 10,
    },
    headerTitle: { color: WHITE, fontSize: 18, fontWeight: '900' },
    listContent: { padding: 20 },
    card: {
        backgroundColor: WHITE,
        borderRadius: 24,
        padding: 20,
        marginBottom: 15,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.05,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    schoolName: { fontSize: 10, color: '#64748B', fontWeight: 'bold', textTransform: 'uppercase' },
    canteenName: { fontSize: 16, fontWeight: 'bold', color: BLUE_PRIMARY },
    dateBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
    dateText: { fontSize: 11, fontWeight: 'bold', color: '#475569' },
    cardBody: { flexDirection: 'row', marginBottom: 15 },
    menuInfo: { flex: 1, marginRight: 15 },
    menuName: { fontSize: 14, fontWeight: 'bold', color: '#1E293B' },
    menuDesc: { fontSize: 12, color: '#64748B', marginTop: 4 },
    menuThumb: { width: 60, height: 60, borderRadius: 12 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 15, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    feedbackStatus: { flexDirection: 'row', gap: 15 },
    statusDot: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    statusLabel: { fontSize: 11, color: '#64748B', fontWeight: '500' },
    detailLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    detailLinkText: { fontSize: 12, color: ACCENT, fontWeight: 'bold' },
    
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { color: '#94A3B8', marginTop: 15, fontSize: 14, fontWeight: 'bold' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: WHITE, borderTopLeftRadius: 30, borderTopRightRadius: 30, height: '90%', padding: 25 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: BLUE_PRIMARY },
    modalBody: { flex: 1 },
    modalSchool: { fontSize: 12, color: '#64748B', fontWeight: 'bold', textTransform: 'uppercase' },
    modalCanteen: { fontSize: 22, fontWeight: 'bold', color: BLUE_PRIMARY, marginTop: 4 },
    modalDateBox: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
    modalDate: { fontSize: 14, color: '#475569', fontWeight: '500' },
    sectionLabel: { fontSize: 13, fontWeight: 'bold', color: '#64748b', marginTop: 20, marginBottom: 8, textTransform: 'uppercase' },
    modalMenuName: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
    modalMenuDesc: { fontSize: 14, color: '#64748B', marginTop: 5, lineHeight: 20 },
    modalImage: { width: '100%', height: 250, borderRadius: 20, marginTop: 15 },
    feedbackInput: { backgroundColor: '#F1F5F9', borderRadius: 15, padding: 15, height: 100, textAlignVertical: 'top', marginTop: 10 },
    submitBtn: { backgroundColor: ACCENT, height: 55, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginTop: 25, marginBottom: 30 },
    submitBtnText: { color: WHITE, fontSize: 16, fontWeight: 'bold' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-end' },
    statusBadgeTxt: { fontSize: 9, fontWeight: '900' }
});
