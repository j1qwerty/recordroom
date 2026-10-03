<?php

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/**
 * Description of class_activity
 *
 * @author srishti
 */


class Class_activity {

    public $activity_id = null;
    public $activity_user_id = null;
    public $activity_date = null;
    public $activity_detail = null;
    public $activity_status = null;
    public $activity_action = null;

    public $login_id = null;
    public $verification_id = null;
    public $emp_id = null;
    public $status = null;
    public $remark = null;
    public $verified_by = null;
    
    public function DisplayDetails() {
        $activity_detail = "";
        switch ($this->activity_action) {                
            case "NEWLP":
                $arr_data = json_decode($this->activity_detail, true);
                $login_id = $arr_data["login_id"];
                $CI =& get_instance();
                $CI->load->model('User_model');
                $result = $CI->User_model->get_user_by_id($login_id);
                $user_name = $result->Name;
                $num_str = sprintf("%06d", $arr_data["req_id"]);
                 $code = "LP-".$num_str;
                $activity_detail = $user_name." has created a new LP with request id '".$code."'";
                //echo $activity_detail;
                //die;
                break;
        }
        return $activity_detail;
    }

    public function LogDetails() {
        //$ObjC = new common();
        $activity_arr = array();
        switch ($this->activity_action) {
            case "ADDVER":
            case "UPDVER":
                $activity_arr = array('login_id' => $this->login_id, 'verification_id' => $this->verification_id, 'emp_id' => $this->emp_id,'status' => $this->status, 'remark' => $this->remark, 'verified_by' => $this->verified_by);
                break;
            }
        // encodes the array into a string in JSON format (JSON_PRETTY_PRINT - uses whitespace in json-string, for human readable)
        $activity_detail = json_encode($activity_arr, JSON_PRETTY_PRINT);
        //$this->activity_detail = $ObjC->StrToDB($activity_detail);
        $this->activity_detail = $activity_detail;

        $S = "INSERT INTO `activity_log_tbl` (`activity_user_id`,`activity_date`,`activity_action`,`activity_detail`) VALUES
            ('".$this->activity_user_id."','" . date("Y-m-d H:i:s") . "','" . $this->activity_action . "','" . $this->activity_detail . "')";

return $S;
        //$this->IActivity();
    }

//please add "activity_by"
    private function IActivity() {
        //$ObjDB = new class_db();
        $S = "INSERT INTO `activity_log_tbl` (`activity_user_id`,`activity_date`,`activity_action`,`activity_detail`) VALUES
            ('".$this->activity_user_id."','" . date("Y-m-d H:i:s") . "','" . $this->activity_action . "','" . $this->activity_detail . "')";
        //$ObjDB->sproc_name = $S;
        //$R = $ObjDB->ExecuteQuery();        
        return "OK";
    }

    public function SActivity() {
        //$ObjDB = new class_db();
        $S = "SELECT * FROM `activity_log_tbl` ORDER BY `activity_date` DESC LIMIT " . $this->page_number . "," . $this->page_size . "";
        //$ObjDB->sproc_name = $S;
        //$R = $ObjDB->SelectQuery();
        return $R;
    }   

}
