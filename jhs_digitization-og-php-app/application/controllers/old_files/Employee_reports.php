<?php
header("Access-Control-Allow-Origin: *");
defined('BASEPATH') OR exit('No direct script access allowed');

class Employee_reports extends CI_Controller {

	public function __construct()
	{
		parent::__construct();		
	}


	public function index()
	{
		require_once(APPPATH.'libraries/Class_api.php');
		require_once(APPPATH.'libraries/Class_basic.php');	
		$RES = "";
$arr = array();

$api_key = empty($this->input->get('api_key')) ? "501" : $this->input->get('api_key');
$api_key = ($api_key == Class_api::req_api_key()) ? "VALID" : "501";
$action = empty($this->input->get('action')) ? "400" : $this->input->get('action');

if ($api_key == "501") {
    $arr["res_status"] = "501";
} elseif ($action == "400") {
    $arr["res_status"] = "400";
} else {
    $arr["api_res_key"] = Class_api::res_api();
    switch ($action) {
        case "emp_registration":
        // $json = '{"gender":"M",
        //         "emp_name":"shivam",
        //         "dob":"1980-08-31",
        //         "aadhar":"876998693",
        //         "mobile":"7897807098",
        //         "empcd":"765877"}';

            $json = file_get_contents('php://input');
            $obj = json_decode($json);
            
            $OTh = new Class_basic();
            $OTh->empcode = $obj->empcd;
            $OTh->empname = $obj->emp_name;
            $OTh->gender = $obj->gender;
            $OTh->dob = $obj->dob;
            $OTh->mobile = $obj->mobile;
            $OTh->aadhar = $obj->aadhar;
            $R = $OTh->check_existance();
            if(count($R) < 1) {
                $M = $OTh->check_mobile_existance();
                if($M == null) {
                $rndno = rand(1000, 9999);
                 $OTh->otp = $rndno;
                  $this->send_otp($OTh->mobile, $OTh->otp);
                 $S = $OTh->emp_registration();
                if($S > 0) {
                    $arr['res_data'] = array(
                                        'emp_name' => $OTh->empname,
                                        'emp_code' => $OTh->empcode,
                                        'mobile'   => $OTh->mobile,
                                        'otp'      => $rndno
                                        );
                    $arr["res_status"] = "200";
                } else {
                    $arr["res_status"] = "404";
                    //$arr["res_msg"] = "Failed to register employee!";
                }
             } else {
                $arr["res_status"] = "403";
                //$arr["res_msg"] = "Mobile no. already exists! Please enter unique mobile number";
             }
            } else {
                $arr["res_status"] = "402";
                //$arr["res_msg"] = "Employee code already exists!";
            }
            break;

    	case "check":
    		$OTh = new Class_basic();
    		$OTh->empcode = $this->input->get('empcd');        
    		 $R = $OTh->check_employee();
             
    		if(count($R) > 0) {
                $emp_id = $OTh->check_main_emp_table();
                $OTh->empid = $emp_id;
                $record = $OTh->check_records();
                if($record[0]->SB > 0 || $record[0]->LR > 0 || $record[0]->SR > 0 || $record[0]->APAR > 0) {
    				$rndno = rand(1000, 9999);
					$OTh->otp = $rndno;
					$OTh->empcode = $R[0]->employee_code;
					$OTh->mobile = $R[0]->mobile;
					$S = $OTh->submit_otp();
				if($S > 0){
                    $this->send_otp($OTh->mobile, $OTh->otp);
					$arr['res_data'] = array(
                                        'emp_name'=> $R[0]->employee_name,
                                        'emp_code'=>$R[0]->employee_code,
                                        'mobile'=> $R[0]->mobile,
                                        'otp' => $rndno
                                        );
                    $arr["res_status"] = "200";
					} else {
					$arr["res_status"] = "403";
                    //$arr["res_msg"] = "OTP sending failed";
					 }
                 }  else {
                    $arr["res_status"] = "402";
                    //$arr["res_msg"] = "Records are currently under scanning process. Please check after few days for updated records.";
                 }  				
    		  } else {
    			 $arr["res_status"] = "401";
                 //$arr["res_msg"] = "Please register using link below.";
    		  }
    		break;

            case "match_otp":
            $OTh = new Class_basic();
            $OTh->empcode = $this->input->get('empcd');
            $OTh->mobile = $this->input->get('mobile'); 
            $OTh->otp = $this->input->get('otp');
            $R = $OTh->match_otp();
            if(count($R) > 0) {
                $arr['res_data'] = array('emp_code' => $R[0]->employee_code);
                $arr["res_status"] = "200";
            } else {
                $arr["res_status"] = "401";
            }
            break;

            case "check_records":
            $OTh = new Class_basic();
            $OTh->empcode = $this->input->get('empcd');
            $emp_id = $OTh->check_main_emp_table();
            if($emp_id > 0) {
                $OTh->empid = $emp_id;
                //$S = $OTh->check_records();
                $RSB = $OTh->getallservicebook();
                $sb_count = 0;
                if($RSB != null){                    
                  foreach ($RSB as $key => $value) {
                        $RSB[$key]->imgurl = base_url().'uploads/'.$OTh->empcode.'/service_book/'.$value->filename;
                  }
                  $sb_count = count($RSB);
                }

                $RLR = $OTh->getallleavereport();
                 $lr_count = 0;
                 if($RLR != null){   
                     foreach ($RLR as $key => $value) {
                         $RLR[$key]->imgurl = base_url().'uploads/'.$OTh->empcode.'/leave_report/'.$value->filename;
                        }
                        $lr_count = count($RLR);
                    }

                $RSR = $OTh->getSRdetail();
                $sr_count = 0;
                if($RSR != null){   
                foreach ($RSR as $key => $value) {
                             $RSR[$key]->imgurl = base_url().'uploads/'.$OTh->empcode.'/sr/'.$value->filename;
                            }
                         $sr_count = count($RSR);
                        }

                $RAP = $OTh->getApardetail();
                 $apar_count = 0;
                 if($RAP != null){   
                         foreach ($RAP as $key => $value) {
                             $RAP[$key]->imgurl = base_url().'uploads/'.$OTh->empcode.'/apar/'.$value->filename;
                            }
                         $apar_count = count($RAP);
                        } 

                 $arr['res_data'] = array(
                                        'emp_code' => $OTh->empcode,
                                        'sr_count' => $sb_count,
                                        'lr_count' => $lr_count,
                                        'sr_attach_count' => $sr_count,
                                        'apar_count' => $apar_count,  
                                        'sr' => $RSB,
                                        'lr' => $RLR,
                                        'sr_attach' => $RSR,
                                        'apar' => $RAP
                                        );
                $arr["res_status"] = "200";                     
            } else {
                $arr["res_status"] = "401";
                //$arr["res_status"] = "Records are currently under scanning process. Please check after few days for updated records.";
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
	}

    public function send_otp($mobile, $otp)
    {
         $message="'".$otp."'";
  
         $phonee = $mobile;

         $user="srdpo.nrlko";

         $pass="htl@2020";

         $sender="BHRAIL";

         if(strlen($phonee))
         {

        $phne=$phonee;

        $parameters="user=$user&pass=$pass&sender=$sender&phone=$phne&text=$message&priority=ndnd&stype=normal";

        $url="http://msg.hashtaglabs.in/api/sendmsg.php?";

        $ch = curl_init($url);

        curl_setopt($ch, CURLOPT_POSTFIELDS, "user=$user&pass=$pass&sender=$sender&phone=$phne&text=$message&priority=ndnd&stype=normal");

        curl_setopt($ch, CURLOPT_POST,1);

        curl_setopt($ch, CURLOPT_POSTFIELDS,$parameters);

        curl_setopt($ch, CURLOPT_FOLLOWLOCATION,1); 

        curl_setopt($ch,CURLOPT_HEADER,0);  // DO NOT RETURN HTTP HEADERS 

        curl_setopt($ch, CURLOPT_RETURNTRANSFER,1);  // RETURN THE CONTENTS OF THE CALL

        $return_val = curl_exec($ch);
        }
    }
	
}
