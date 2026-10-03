<?php

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/**
 * Description of class_basic
 *
 * @author srishti
 */
//include_once 'class_db.php';
class Class_basic extends CI_model {
    //put your code here
    public $empcode;
    public $otp;
    public $mobile;
    public $empid;
    public $empname;
    public $gender;
    public $dob;
    public $aadhar;

    public function emp_registration()
    {
        $query=$this->db->query("insert into `registration`(`employee_code`, `employee_name`, `gender`, `dob`, `mobile`, `aadhar`, `otp`) values('".$this->empcode."', '".$this->empname."', '".$this->gender."', '".$this->dob."', '".$this->mobile."', '".$this->aadhar."', '".$this->otp."')");
        return $query;
    }

    public function check_existance()
    {
        if(!empty($this->empcode)) {   
            $query=$this->db->query("select * from registration where employee_code='".$this->empcode."'");
            $result=$query->result();
            return $result;
            }
    }

    public function check_mobile_existance()
    {
        if(!empty($this->empcode)) {   
            $query=$this->db->query("select * from registration where mobile='".$this->mobile."'");
            $result=$query->result();
            return $result;
            }
    }

    public function check_employee()
    {
        if(!empty($this->empcode)) {   
            $query=$this->db->query("select * from registration where employee_code='".$this->empcode."' or mobile='".$this->empcode."'");
            $result=$query->result();
            return $result;
            }
    }

    public function submit_otp()
    {
        if(!empty($this->empcode)) {   
        $query = $this->db->query("update `registration` set `otp` = '".$this->otp."' where `employee_code` = '".$this->empcode."' and `mobile`='".$this->mobile."'");
        return $query;
        }
    }

    public function match_otp()
    {
        if(!empty($this->empcode) && !empty($this->mobile) && !empty($this->otp)) {   
            $query=$this->db->query("select * from registration where employee_code='".$this->empcode."' and mobile='".$this->mobile."' and otp='".$this->otp."'");
            $result=$query->result();
            if(!empty($result)) {
                $this->db->query("update `registration` set `status` = 1 where `employee_code` = '".$this->empcode."'");
            } 
            return $result;
            }
    }

    public function delete_otp_rows()
    {
        if(!empty($this->empcode)) {
        $query = $this->db->query("delete from `otp_table` where `emp_cd`='".$this->empcode."'");
        //$result = $query->result();
        return $query;
        }
    }

    public function check_main_emp_table()
    {   $emp_id = 0;
        if(!empty($this->empcode)) {
        $query=$this->db->query("select emp_id from drm_employee where employee_code='".$this->empcode."'");
        $result = $query->result();
        return (empty($result[0]->emp_id) ? $emp_id : $result[0]->emp_id);
        }
    }

    public function check_records()
    {
        if(!empty($this->empid)) {
        $query=$this->db->query("select drm.emp_id, 
            (select COUNT(*) from employee_service_book sb WHERE sb.emp_id='".$this->empid."' and sb.status!='Inactive') AS SB, 
            (select COUNT(*) from upload_emp_lr lr WHERE lr.emp_id='".$this->empid."' and lr.status!='Inactive') AS LR, 
            (select COUNT(*) from upload_sr sr WHERE sr.emp_id='".$this->empid."' and sr.status!='Inactive') AS SR, 
            (select COUNT(*) from upload_apar apar WHERE apar.emp_id='".$this->empid."' and apar.status!='Inactive') AS APAR from drm_employee as drm where drm.emp_id='".$this->empid."'");
        $result = $query->result();
        return $result;
        }
    }

    public function getallservicebook()
    {
        $query=$this->db->query("select * from employee_service_book where status!='Inactive' and emp_id='".$this->empid."' order by pageno asc");
        $rs=$query->result();
        return $rs;    
    }

    public function getallleavereport()
    {
        $query=$this->db->query("select * from upload_emp_lr where status!='Inactive' and emp_id='".$this->empid."' order by pageno asc");
        $rs=$query->result();
        return $rs;
    }

    public function getSRdetail()
    {
        $query=$this->db->query("select * from upload_sr where emp_id='".$this->empid."' and status!='Inactive' order by pageno asc"); 
        $rs=$query->result();
        return $rs; 
    }

    public function getApardetail()
    {
        $query=$this->db->query("select * from upload_apar where emp_id='".$this->empid."' and status!='Inactive' order by id asc limit 3"); 
        $rs=$query->result();
        return $rs; 
    }

}
