<?php
header('Content-Type: text/plain');

$src = "C:\\Users\\asus\\.gemini\\antigravity\\brain\\9f146a45-8067-40db-81a3-2e7f4e361f3c\\logo_lavirameal_transparent_1779165354806.png";
$dest = "c:\\xampp\\htdocs\\project_lavirameal\\assets\\LOGO_LAVIRAMEAL_TRANSPARENT.png";

echo "Source file exists: " . (file_exists($src) ? "Yes" : "No") . "\n";
echo "Destination dir exists: " . (is_dir(dirname($dest)) ? "Yes" : "No") . "\n";

if (file_exists($src)) {
    if (copy($src, $dest)) {
        echo "Successfully copied transparent logo to assets/LOGO_LAVIRAMEAL_TRANSPARENT.png\n";
    } else {
        echo "Error: Failed to copy file.\n";
    }
} else {
    echo "Error: Source file does not exist.\n";
}
?>
