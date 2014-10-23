<?php
 $num1 = $_GET['num1'];
 $num2 = $_GET['num2'];
 echo json_encode(array("result" => $num1 * $num2));
?>