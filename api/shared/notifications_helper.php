<?php
function createNotification($db, $title, $message, $type, $role = null, $sekolah_id = null, $user_id = null) {
    try {
        $id = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x', mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0x0fff) | 0x4000, mt_rand(0, 0x3fff) | 0x8000, mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff));
        
        $stmt = $db->prepare("INSERT INTO notifications (id, title, message, type, role, sekolah_id, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$id, $title, $message, $type, $role, $sekolah_id, $user_id]);
        return true;
    } catch (Exception $e) {
        return false;
    }
}
?>
