import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    SafeAreaView,
    StatusBar,
    Alert,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import apiClient from '../../../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BLUE_PRIMARY = '#0F172A';
const WHITE = '#FFFFFF';
const GRAY_BG = '#F8FAFC';
const ACCENT = '#3B82F6';

export default function MenuDetailScreen({ route, navigation }) {
    const { post_id } = route.params;
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [comment, setComment] = useState('');
    const [user, setUser] = useState(null);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const userData = await AsyncStorage.getItem('user_data');
            setUser(JSON.parse(userData));

            const response = await apiClient.get('shared/get_menu_detail.php', {
                params: { post_id }
            });
            setData(response.data.data);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Gagal memuat data');
        } finally {
            setLoading(false);
        }
    };

    const handleSendComment = async () => {
        if (!comment.trim()) return;

        setSending(true);
        try {
            await apiClient.post('shared/add_menu_comment.php', {
                post_id: post_id,
                admin_id: user.id,
                komentar: comment
            });
            setComment('');
            loadData(); // Refresh to show new comment
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Gagal mengirim komentar');
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color={BLUE_PRIMARY} />
            </View>
        );
    }

    const { post, comments } = data;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={WHITE} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Detail Postingan Menu</Text>
                <View style={{ width: 24 }} />
            </View>

            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Foto Menu */}
                    <Image 
                        source={post.image_path ? { uri: post.image_path } : require('../../../../assets/icon.png')} 
                        style={styles.menuImage}
                        resizeMode="cover"
                    />

                    {/* Detail Postingan */}
                    <View style={styles.detailContainer}>
                        <View style={styles.canteenHeader}>
                            <View style={styles.canteenIcon}>
                                <MaterialCommunityIcons name="storefront" size={24} color={WHITE} />
                            </View>
                            <View style={{ marginLeft: 12 }}>
                                <Text style={styles.detailCanteenName}>{post.nama_kantin}</Text>
                                <Text style={styles.detailSchoolName}>{post.nama_sekolah}</Text>
                            </View>
                        </View>

                        <Text style={styles.menuTitle}>{post.menu_name}</Text>
                        <Text style={styles.menuPrice}>{parseInt(post.price).toLocaleString('id-ID')} Poin MBG</Text>
                        
                        <View style={styles.infoBox}>
                            <View style={styles.infoItem}>
                                <Ionicons name="time-outline" size={18} color={BLUE_PRIMARY} />
                                <Text style={styles.infoText}>Tersedia: {post.jam_mulai.substring(0,5)} - {post.jam_selesai.substring(0,5)}</Text>
                            </View>
                            <View style={styles.infoItem}>
                                <Ionicons name="calendar-outline" size={18} color={BLUE_PRIMARY} />
                                <Text style={styles.infoText}>Diunggah: {new Date(post.created_at).toLocaleString('id-ID')}</Text>
                            </View>
                        </View>

                        <Text style={styles.sectionTitle}>Deskripsi Menu</Text>
                        <Text style={styles.menuDescription}>{post.menu_description || 'Tidak ada deskripsi'}</Text>

                        {/* Komentar Section */}
                        <View style={styles.commentSection}>
                            <Text style={styles.sectionTitle}>Evaluasi & Komentar</Text>
                            {comments.length === 0 ? (
                                <Text style={styles.emptyComment}>Belum ada komentar</Text>
                            ) : (
                                comments.map((comm, index) => (
                                    <View key={comm.id} style={styles.commentCard}>
                                        <View style={styles.commentHeader}>
                                            <Text style={styles.commentAdminName}>{comm.admin_nama}</Text>
                                            <View style={styles.adminRoleBadge}>
                                                <Text style={styles.adminRoleText}>{comm.admin_role.toUpperCase()}</Text>
                                            </View>
                                        </View>
                                        <Text style={styles.commentText}>{comm.komentar}</Text>
                                        <Text style={styles.commentDate}>{new Date(comm.created_at).toLocaleString('id-ID')}</Text>
                                    </View>
                                ))
                            )}
                        </View>
                    </View>
                </ScrollView>

                {/* Input Komentar */}
                <View style={styles.inputArea}>
                    <TextInput 
                        style={styles.commentInput}
                        placeholder="Tulis catatan evaluasi..."
                        value={comment}
                        onChangeText={setComment}
                        multiline
                    />
                    <TouchableOpacity 
                        style={[styles.sendButton, { opacity: comment.trim() ? 1 : 0.5 }]}
                        onPress={handleSendComment}
                        disabled={sending || !comment.trim()}
                    >
                        {sending ? (
                            <ActivityIndicator size="small" color={WHITE} />
                        ) : (
                            <Ionicons name="send" size={20} color={WHITE} />
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
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
        zIndex: 10,
    },
    headerTitle: {
        color: WHITE,
        fontSize: 17,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    menuImage: {
        width: '100%',
        height: 300,
        backgroundColor: '#E2E8F0',
    },
    detailContainer: {
        padding: 25,
        marginTop: -40,
        backgroundColor: WHITE,
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    canteenHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 25,
        backgroundColor: '#F8FAFC',
        padding: 15,
        borderRadius: 20,
    },
    canteenIcon: {
        width: 50,
        height: 50,
        borderRadius: 15,
        backgroundColor: BLUE_PRIMARY,
        justifyContent: 'center',
        alignItems: 'center',
    },
    detailCanteenName: {
        fontSize: 18,
        fontWeight: '900',
        color: '#0F172A',
    },
    detailSchoolName: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '700',
        marginTop: 2,
    },
    menuTitle: {
        fontSize: 26,
        fontWeight: '900',
        color: '#0F172A',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    menuPrice: {
        fontSize: 20,
        fontWeight: '800',
        color: ACCENT,
        marginBottom: 25,
    },
    infoBox: {
        backgroundColor: '#F8FAFC',
        padding: 20,
        borderRadius: 24,
        marginBottom: 30,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    infoText: {
        fontSize: 14,
        color: '#475569',
        marginLeft: 12,
        fontWeight: '600',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#0F172A',
        marginBottom: 15,
    },
    menuDescription: {
        fontSize: 15,
        lineHeight: 24,
        color: '#64748B',
        marginBottom: 35,
        fontWeight: '500',
    },
    commentSection: {
        marginTop: 10,
    },
    emptyComment: {
        textAlign: 'center',
        color: '#94A3B8',
        fontWeight: '600',
        marginTop: 20,
        marginBottom: 30,
    },
    commentCard: {
        backgroundColor: '#F8FAFC',
        padding: 20,
        borderRadius: 24,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    commentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    commentAdminName: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0F172A',
    },
    adminRoleBadge: {
        backgroundColor: '#E2E8F0',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    adminRoleText: {
        color: '#475569',
        fontSize: 9,
        fontWeight: '900',
    },
    commentText: {
        fontSize: 14,
        color: '#475569',
        lineHeight: 22,
        fontWeight: '500',
    },
    commentDate: {
        fontSize: 11,
        color: '#94A3B8',
        marginTop: 12,
        fontWeight: '600',
    },
    inputArea: {
        flexDirection: 'row',
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 35 : 20,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        backgroundColor: WHITE,
        alignItems: 'center',
    },
    commentInput: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        borderRadius: 18,
        paddingHorizontal: 18,
        paddingVertical: 12,
        maxHeight: 120,
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        fontSize: 14,
        color: '#0F172A',
    },
    sendButton: {
        width: 50,
        height: 50,
        borderRadius: 18,
        backgroundColor: '#0F172A',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
    },
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: GRAY_BG,
    }
});
