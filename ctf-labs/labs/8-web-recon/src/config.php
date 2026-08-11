<?php
// File cấu hình lộ ra (sai lầm phổ biến)
header('Content-Type: text/plain');
echo "DB_HOST=localhost\n";
echo "DB_USER=root\n";
echo "DB_PASS=Sup3rS3cr3t\n";
echo "FLAG=" . file_get_contents('/flag.txt');
?>
