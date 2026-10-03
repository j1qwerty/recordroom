<?php
class Class_master_activity {


    public $activity_id = null;
    public $activity_user_id = null;
    public $activity_date = null;
    public $activity_detail = null;
    public $activity_status = null;
    public $activity_action = null;

    public $login_id = null;
    public $master_id = null;
    public $master_name = null;
    public $zone_id = null;

    public $v_company = null;
    public $v_name = null;
    public $v_phone = null;
    public $v_email = null;
    public $v_gst = null;
    public $v_address = null;
    
    public function DisplayDetails() {
        $activity_detail = "";
        switch ($this->activity_action) {            
            
            case "TEMP":
                $arr_data = json_decode($this->activity_detail, true);
                $activity_detail = "Test";
                echo $activity_detail;
                die;
                break;
        }
        return $activity_detail;
    }

    public function LogDetails() {
        //$ObjC = new common();
        $activity_arr = array();
        switch ($this->activity_action) {
            case "ADDOCSPE":
            case "UPDOCSPE":
            case "DEDOCSPE":
            case "ADMEDTYPE":
            case "UPMEDTYPE":
            case "ADEMPDEP":
            case "UPEMPDEP":
            case "ADEMPDES":
            case "UPEMPDES":
             case "ADSTAT":
              case "UPSTAT":
              case "ADZONE":
              case "UPZONE":
              case "ADBRAND":
              case "UPBRAND":
              case "ADDISEAS":
              case "UPDISEAS":
              case "ADREMRK":
              case "UPREMRK":
              case "ADROLE":
              case "UPROLE":
                $activity_arr = array('login_id' => $this->login_id, 'master_id' => $this->master_id, 
                    'master_name' => $this->master_name);
                break;

            case "ADDOCUNIT":
            case "UPDOCUNIT":
                $activity_arr = array('login_id' => $this->login_id, 'master_id' => $this->master_id, 'zone_id' => $this->zone_id,
                    'master_name' => $this->master_name);
                break;

            case "ADVNDR":
            case "UPVNDR":
                $activity_arr = array('login_id' => $this->login_id, 'master_id' => $this->master_id, 'v_company' => $this->v_company, 
                    'v_name' => $this->v_name, 'v_phone' => $this->v_phone, 'v_email' => $this->v_email, 
                    'v_gst' => $this->v_gst, 'v_address' => $this->v_address, );
        }
        // encodes the array into a string in JSON format (JSON_PRETTY_PRINT - uses whitespace in json-string, for human readable)
        $activity_detail = json_encode($activity_arr, JSON_PRETTY_PRINT);
        //$this->activity_detail = $ObjC->StrToDB($activity_detail);
        $this->activity_detail = $activity_detail;

        $S = "INSERT INTO `master_log_tbl` (`activity_user_id`,`activity_date`,`activity_action`,`activity_detail`) VALUES
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