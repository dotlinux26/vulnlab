<?php
$page = $_GET['page'] ?? 'home.php';

// LỖI CỐ Ý: include trực tiếp tham số — LFI & RFI
include($page);
?>
