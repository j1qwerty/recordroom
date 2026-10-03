<?php

header("Access-Control-Allow-Origin: *");
include_once 'classes/class_api.php';
include_once 'classes/class_basic.php';
$RES = "";
$arr = array();
$api_key = empty($_REQUEST["api_key"]) ? "501" : $_REQUEST["api_key"];
$api_key = ($api_key == class_api::req_api_key()) ? "VALID" : "501";
$action = empty($_REQUEST["action"]) ? "400" : $_REQUEST["action"];
if ($api_key == "501") {
    $arr["res_status"] = "501";
} elseif ($action == "400") {
    $arr["res_status"] = "400";
} else {
    $arr["api_res_key"] = class_api::res_api();
    switch ($action) {
        case "scity":
            $OTh = new class_basic();
            $OTh->state = $_REQUEST["req_state"];
            $R = $OTh->SCity();
            if ($R != null && mysqli_num_rows($R) > 0) {
                $arr["res_status"] = "200";
                while ($row = mysqli_fetch_array($R)) {
                    $aR = array();
                    $aR["city_id"] = $row["city_id"];
                    $aR["city_name"] = $row["city_name"];
                    $arr["res_data"][$row["city_id"]] = $aR;
                }
            } else {
                $arr["res_status"] = "401";
            }
            break;
        case "sstate":
            $OTh = new class_basic();
            $R = $OTh->SState();
            if ($R != null && mysqli_num_rows($R) > 0) {
                $arr["res_status"] = "200";
                while ($row = mysqli_fetch_array($R)) {
                    $aR = array();
                    $aR["state_id"] = $row["state_id"];
                    $aR["state_name"] = $row["state_name"];
                    $arr["res_data"][$row["state_id"]] = $aR;
                }
            } else {
                $arr["res_status"] = "401";
            }
            break;
        default:
            $arr["api_res_key"] = "NOT VALID";
            $arr["res_status"] = "601";
            break;
    }
}
$RES = json_encode($arr);
echo $RES;
?>

