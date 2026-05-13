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
    RefreshControl
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import apiClient from '../../../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';

const BLUE_PRIMARY = '#0F172A';
const WHITE = '#FFFFFF';
const GRAY_BG = '#F8FAFC';
const SUCCESS = '#10B981';
const WARNING = '#F59E0B';
const ACCENT = '#3B82F6';

export default function MonitoringMenuScreen({ navigation }) {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [user, setUser] = useState(null);
    const [showPicker, setShowPicker] = useState(false);

    useEffect(() => {
        loadUserAndData();
    }, [selectedDate]);

    const loadUserAndData = async () => {
        setLoading(true);
        try {
            const userData = await AsyncStorage.getItem('user_data');
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);

            const params = {
                tanggal: selectedDate,
            };
            
            // Jika role adalah admin sekolah, filter berdasarkan sekolah_id mereka
            if (parsedUser.role === 'sekolah') {
                params.sekolah_id = parsedUser.sekolah_id;
            }

            const response = await apiClient.get('shared/get_monitoring_menu.php', { params });
            setData(response.data.data);
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

    const renderItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.card}
            onPress={() => item.post_id && navigation.navigate('DetailPostinganMenu', { post_id: item.post_id })}
        >
            <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.schoolName}>{item.nama_sekolah}</Text>
                    <Text style={styles.canteenName}>{item.nama_kantin}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: item.sudah_posting ? '#ECFDF5' : '#FFF7ED' }]}>
                    <Text style={[styles.statusText, { color: item.sudah_posting ? SUCCESS : WARNING }]}>
                        {item.sudah_posting ? '✅ Sudah Posting' : '⚠️ Belum Posting'}
                    </Text>
                </View>
            </View>
            
            {item.sudah_posting && (
                <View style={styles.cardFooter}>
                    <View style={styles.infoRow}>
                        <Ionicons name="fast-food-outline" size={16} color="#64748B" />
                        <Text style={styles.footerInfo}>{item.menu_name}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="time-outline" size={16} color="#64748B" />
                        <Text style={styles.footerInfo}>Posting jam {item.waktu_posting}</Text>
                    </View>
                </View>
            )}
        </TouchableOpacity>
    );

    const changeDate = (days) => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + days);
        setSelectedDate(d.toISOString().split('T')[0]);
    };

    const onDateChange = (event, date) => {
        setShowPicker(false);
        if (date) {
            setSelectedDate(date.toISOString().split('T')[0]);
        }
    };

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

            {/* Date Selector */}
            <View style={styles.dateSelector}>
                <TouchableOpacity onPress={() => changeDate(-1)} style={styles.navBtn}>
                    <Ionicons name="chevron-back" size={24} color={BLUE_PRIMARY} />
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={styles.dateContainer} 
                    onPress={() => setShowPicker(true)}
                    activeOpacity={0.7}
                >
                    <MaterialCommunityIcons name="calendar-month" size={22} color={ACCENT} />
                    <View style={styles.dateTextWrapper}>
                        <Text style={styles.dateLabel}>Pilih Tanggal</Text>
                        <Text style={styles.dateText}>
                            {new Date(selectedDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => changeDate(1)} style={styles.navBtn}>
                    <Ionicons name="chevron-forward" size={24} color={BLUE_PRIMARY} />
                </TouchableOpacity>
            </View>

            {showPicker && (
                <DateTimePicker
                    value={new Date(selectedDate)}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onDateChange}
                />
            )}

            {loading && !refreshing ? (
                <View style={styles.loading}>
                    <ActivityIndicator size="large" color={BLUE_PRIMARY} />
                </View>
            ) : (
                <FlatList
                    data={data}
                    keyExtractor={item => (item.kantin_id || item.id || Math.random()).toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="food-off" size={64} color="#CBD5E1" />
                            <Text style={styles.emptyText}>Tidak ada data kantin ditemukan</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: GRAY_BG,
    },
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
    headerTitle: {
        color: WHITE,
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    dateSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: WHITE,
        paddingVertical: 18,
        paddingHorizontal: 22,
        margin: 20,
        borderRadius: 24,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 15,
        flex: 1,
        marginHorizontal: 15,
    },
    dateTextWrapper: {
        marginLeft: 10,
    },
    dateLabel: {
        fontSize: 10,
        color: '#64748B',
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    dateText: {
        fontSize: 14,
        fontWeight: '800',
        color: BLUE_PRIMARY,
    },
    navBtn: {
        padding: 5,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 30,
    },
    card: {
        backgroundColor: WHITE,
        borderRadius: 24,
        padding: 20,
        marginBottom: 15,
        elevation: 4,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    schoolName: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    canteenName: {
        fontSize: 17,
        fontWeight: '900',
        color: '#0F172A',
        marginTop: 4,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '900',
    },
    cardFooter: {
        borderTopWidth: 1,
        borderTopColor: '#F8FAFC',
        paddingTop: 15,
        marginTop: 5,
        gap: 8,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    footerInfo: {
        fontSize: 13,
        color: '#475569',
        marginLeft: 10,
        fontWeight: '600',
    },
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 100,
        opacity: 0.5,
    },
    emptyText: {
        color: '#94A3B8',
        marginTop: 15,
        fontSize: 15,
        fontWeight: 'bold',
    }
});
