<?php
class User_model extends CI_Model {

    public function __construct() {
        parent::__construct();
    }

    public function Get_employee_code($empcode) {
        $query = $this->db->query("select emp_id from drm_employee where employee_code='$empcode'");
        $result = $query->result();
        return $result[0]->emp_id;
    }

    public function login_process_check($user, $pass) {
        $query = $this->db->query("select * from drm_login where user_name='$user' and password='" . $pass . "'");
        $num = $query->result();
        return $num;
    }

    public function check_records($user) {
        $query = $this->db->query("select * from drm_employee where employee_code='$user' or mobile='$user'");
        $num = $query->result();
        return $num;
    }

    public function getEmployeeDetails($employee_code) {
        $query = $this->db->query("SELECT * from drm_employee WHERE employee_code = '$employee_code'");
        return $query->row();
    }

    public function add_employee_document($data) {
        $this->db->insert('employee_document', $data);
    }
    public function add_employee($data, $emp_code) {
        $this->db->insert('drm_employee', $data);
//        if (!file_exists("uploads/" . $emp_code)) {
//            mkdir("uploads/" . $emp_code, 0755);
//            mkdir("uploads/" . $emp_code . "/service_book", 0755);
//            mkdir("uploads/" . $emp_code . "/leave_report", 0755);
//            mkdir("uploads/" . $emp_code . "/apar", 0755);
//            mkdir("uploads/" . $emp_code . "/sr", 0755);
//        }

//        $myfile = fopen("uploads/" . $emp_code . "/service_book/index.html", "w") or die("Unable to open file!");
//        $txt = "You don't have permission to view this file.";
//        fwrite($myfile, $txt);
//
//        fclose($myfile);

//        $myfile = fopen("uploads/" . $emp_code . "/leave_report/index.html", "w") or die("Unable to open file!");
//        $txt = "You don't have permission to view this file.";
//        fwrite($myfile, $txt);
//
//        fclose($myfile);
//
//        $myfile = fopen("uploads/" . $emp_code . "/apar/index.html", "w") or die("Unable to open file!");
//        $txt = "You don't have permission to view this file.";
//        fwrite($myfile, $txt);
//
//        fclose($myfile);
    }

    public function employeelist() {
        $query = $this->db->query("select * from drm_employee order by emp_id desc");

        $rs = $query->result();
        return $rs;
    }

    public function Get_employeelist_with_paging($limit, $start, $sort_by, $sort_order) {
        $offset = ($start - 1) * $limit;
        //echo $limit.'- Statrt -'.$start;
        $sort_order = ($sort_order == 'DESC') ? 'DESC' : 'ASC';
        $sort_columns = array('employee_code', 'employee_name', 'gender', 'mobile');
        $sort_by = (in_array($sort_by, $sort_columns)) ? $sort_by : 'employee_name';

        $f_sort_by = $sort_by . ' ' . $sort_order;
        $sql = "SELECT emp_id, employee_code, employee_name, gender, mobile  FROM drm_employee ORDER BY $f_sort_by LIMIT  $offset, $limit";

        $query = $this->db->query($sql);
        $rs = $query->result();
        return $rs;
    }

    public function employee_count() {
        $query = $this->db->query("select COUNT(*) AS mycount from drm_employee where role=3");
        $rs = $query->row();
        return $rs;
    }

    public function count_employee() {
        $query = $this->db->query("select COUNT(emp_id) as count from drm_employee where role=3");
        $rs = $query->row();
        return $rs;
    }

    public function service_book_count() {
        $query = $this->db->query("select COUNT(DISTINCT emp_id) AS mycount from employee_service_book where status!='Inactive'");
        $rs = $query->row();
        return $rs;
    }

    public function leave_report_count() {
        $query = $this->db->query("select COUNT(DISTINCT emp_id) AS mycount from upload_emp_lr where status!='Inactive'");
        $rs = $query->row();
        return $rs;
    }

    public function sr_attachment_count() {
        $query = $this->db->query("select COUNT(DISTINCT emp_id) AS mycount from upload_attachment where status!='Inactive'");
        $rs = $query->row();
        return $rs;
    }

    public function apar_count() {
        $query = $this->db->query("select COUNT(DISTINCT emp_id) AS mycount from upload_apar where status!='Inactive'");
        $rs = $query->row();
        return $rs;
    }

    public function getemployees($id) {
        $query = $this->db->query("select * from drm_employee where role='$id' order by emp_id desc");
        $rs = $query->result();
        return $rs;
    }

    public function getSBdetail($empid) {
        $query = $this->db->query("select * from employee_service_book where emp_id='$empid' and status!='Inactive' order by pageno asc");
        $rs = $query->result();
        return $rs;
    }
    // himanshu update temp table code
    // public function incrementCounter($type="", $employee_id="") {
    //     $this->db->query("UPDATE employee_document SET $type = $type + 1 where employee_id = '$employee_id'");
    // } 
    // public function decrementCounter($type="", $employee_id="") {
    //     $this->db->query("UPDATE employee_document SET $type = $type - 1 where employee_id = '$employee_id'");
    // }
    public function incrementDecrementCounter($type="", $employee_id="",$value) {
        $this->db->query("UPDATE employee_document SET $type = $value where employee_id = '$employee_id'");
    }
    public function aparUpdateCounter($value="", $employee_id="") {
        $this->db->query("UPDATE employee_document SET apar = '$value' where employee_id = '$employee_id'");
    }
    // himanshu update temp table code
    public function getLRdetail($empid) {
        $query = $this->db->query("select * from upload_emp_lr where emp_id='$empid' and status!='Inactive' order by pageno asc");
        $rs = $query->result();
        return $rs;
    }

    public function getApardetail($empid, $session) {
// $query=$this->db->query("select * from upload_apar where emp_id='$empid' and startdate='$session' and status!='Inactive' order by id asc limit 3"); 
        $query = $this->db->query("select * from upload_apar where emp_id='$empid' and startdate='$session' and status!='Inactive' order by id asc");
        $rs = $query->result();
        return $rs;
    }

    public function getAparall($empid) {
        $query = $this->db->query("select * from upload_apar where emp_id='$empid' and status!='Inactive' order by id asc");
        $rs = $query->result();
        return $rs;
    }

    public function getSRdetail($empid) {
        $query = $this->db->query("select * from upload_attachment where emp_id='$empid' and status!='Inactive' order by pageno asc");
        $rs = $query->result();
        return $rs;
    }

    public function getsingleemployee($id) {
        $query = $this->db->query("select * from drm_employee where emp_id ='$id'");
        $rs = $query->row();
        return $rs;
    }

    /* public function getval($table,$id,$value,$what)
      {
      $query=$this->db->query("select * from $table where $id='$value'");
      $rs=$query->result();
      return $rs[0]->$what;
      } */

    public function getval($table, $id, $value, $what) {
        $query = $this->db->query("select * from $table where $id='$value'");
        $rs = $query->result();
        if (!empty($rs[0]->$what)) {
            return $rs[0]->$what;
        } else {
            return false;
        }
    }

    public function getdocument($table, $id, $value, $what) {
        $query = $this->db->query("select * from $table where $id='$value' order by pageno ASC");
        $rs = $query->result();
        return $rs;
    }

    public function saveservicebook($empid, $newfile_name, $pageno, $version) {
        if ($version > 1) {
            $this->db->query("update employee_service_book set status='Inactive' where pageno='$pageno' and emp_id='$empid'");
        }
        $query = $this->db->query("insert into employee_service_book (emp_id, filename, pageno,version) values ('$empid','$newfile_name','$pageno','$version')");

        return $query;
    }

    public function saveApar($empid, $newfile_name, $pageno, $version, $file) {
        //echo 'version';exit;
        if ($version > 1) {
            $this->db->query("update upload_apar set status='Inactive' where pageno='$pageno' and emp_id='$empid' AND startdate='$file'");
        }
        $query = $this->db->query("insert into upload_apar (emp_id, filename, pageno,version,startdate) values ('$empid','$newfile_name','$pageno','$version','$file')");
        //echo $this->db->last_query();exit;
        return $query;
    }

    public function saveAttachment($empid, $newfile_name, $pageno, $version) {
        if ($version > 1) {
            $this->db->query("update upload_attachment set status='Inactive' where pageno='$pageno' and emp_id='$empid'");
        }
        $query = $this->db->query("insert into upload_attachment (emp_id, filename, pageno,version) values ('$empid','$newfile_name','$pageno','$version')");

        return $query;
    }

    public function saveemplr($empid, $newfile_name, $pageno, $version) {
        if ($version > 1) {
            $this->db->query("update upload_emp_lr set status='Inactive' where pageno='$pageno' and emp_id='$empid'");
        }
        $query = $this->db->query("insert into upload_emp_lr (emp_id,filename,pageno,version) values ('$empid','$newfile_name','$pageno','$version')");
        return $query;
    }

    public function savesr($empid, $newfile_name, $pageno, $version) {
        if ($version > 1) {
            $this->db->query("update upload_attachment set status='Inactive' where pageno='$pageno' and emp_id='$empid'");
        }
        $query = $this->db->query("insert into upload_attachment (emp_id,filename,pageno,version) values ('$empid','$newfile_name','$pageno','$version')");
        return $query;
    }

    public function saveaparreport($empid, $newfile_name, $pageno, $from, $version) {

        if ($version > 1) {
            $this->db->query("update upload_apar set status='Inactive' where pageno='$pageno' and emp_id='$empid'");
        }
        $query = $this->db->query("insert into upload_apar (emp_id,filename,pageno,startdate,version) values ('$empid','$newfile_name','$pageno','$from','$version')");

        return $query;
    }

    public function getPagerVersionServiceBook($empid, $pageno) {
        $query = $this->db->query("select * from employee_service_book where emp_id='$empid' and pageno='$pageno'");
        $rs = $query->result();
        return count($rs) + 1;
    }

    public function getPagerVersionApar($empid, $pageno) {
        $query = $this->db->query("select * from upload_apar where emp_id='$empid' and pageno='$pageno'");
        $rs = $query->result();
        return count($rs) + 1;
    }

    public function getPagerVersionAttachment($empid, $pageno) {
        $query = $this->db->query("select * from upload_attachment where emp_id='$empid' and pageno='$pageno'");
        $rs = $query->result();
        return count($rs) + 1;
    }

// public function getPagerVersionapar($empid,$pageno,$from)
// {
// $query=$this->db->query("select * from  upload_apar where emp_id='$empid' and pageno='$pageno' and startdate='$from'"); 
// $rs=$query->result();
// return count($rs)+1; 
// }

    public function getPagerVersionleavereport($empid, $pageno) {
        $query = $this->db->query("select * from 	upload_emp_lr where emp_id='$empid' and pageno='$pageno'");
        $rs = $query->result();
        return count($rs) + 1;
    }

    public function getPagerVersionsr($empid, $pageno) {
        $query = $this->db->query("select * from 	upload_attachment where emp_id='$empid' and pageno='$pageno'");
        $rs = $query->result();
        return count($rs) + 1;
    }

    public function del_emp($id) {
        $query = $this->db->query("select * from drm_employee where emp_id='$id'");
        $rs = $query->result();
        $this->db->query("delete from drm_login where user_name='" . $rs[0]->employee_code . "'");
        $results = $this->db->query("DELETE FROM `drm_employee` WHERE `emp_id`='$id'");
        return $results;
    }

    public function UpdateEmployeeByID($data, $empid) {
        $this->db->where('emp_id', $empid);
        $results = $this->db->update('drm_employee', $data);
        return $results;
    }

    public function deleteleavereport($id) {
        $query = $this->db->query("select * from upload_emp_lr where lr_id='$id'");
        $rs = $query->result();
        unlink("uploads/" . $this->User_model->getsingleemployee($rs[0]->emp_id)->employee_code . "/leave_report/" . $rs[0]->filename);
        $this->db->query("delete from upload_emp_lr where lr_id='$id'");
    }

    public function deleteservicebook($id) {

        $query = $this->db->query("select * from employee_service_book where sb_id='$id'");
        $rs = $query->result();
        unlink("uploads/" . $this->User_model->getsingleemployee($rs[0]->emp_id)->employee_code . "/service_book/" . $rs[0]->filename);
        $this->db->query("delete from employee_service_book where sb_id='$id'");
    }

    public function deleteapar($id) {
        $query = $this->db->query("select * from upload_apar where id='$id'");
        $rs = $query->result();
        unlink("uploads/" . $this->User_model->getsingleemployee($rs[0]->emp_id)->employee_code . "/apar/" . $rs[0]->filename);

        $this->db->query("delete from upload_apar where id='$id'");
    }

    public function deletesr($id) {
        $query = $this->db->query("select * from upload_attachment where id='$id'");
        $rs = $query->result();
        unlink("uploads/" . $this->User_model->getsingleemployee($rs[0]->emp_id)->employee_code . "/sr/" . $rs[0]->filename);

        $this->db->query("delete from upload_attachment where id='$id'");
    }

    public function getalluploadeservicebookid($id) {
        $sbid = array();
        $query = $this->db->query("select pageno from employee_service_book where emp_id='$id' AND status!='Inactive'");
        $rs = $query->result();
        foreach ($rs as $rss) {

            $sbid[] = $rss->pageno;
        }
        return implode(",", $sbid);
    }

    public function getalluploadedleavereportid($id) {
        $sbid = array();
        $query = $this->db->query("select pageno from upload_emp_lr where emp_id='$id' AND status!='Inactive'");
        $rs = $query->result();
        foreach ($rs as $rss) {
            $sbid[] = $rss->pageno;
        }
        return implode(",", $sbid);
    }

    public function getalluploadedsrid($id) {
        $sbid = array();
        $query = $this->db->query("select pageno from upload_attachment where emp_id='$id' AND status!='Inactive'");
        $rs = $query->result();
        foreach ($rs as $rss) {

            $sbid[] = $rss->pageno;
        }
        return implode(",", $sbid);
    }

    public function getalluploadedaparid($id) {
        $sbid = array();
        $query = $this->db->query("select startdate,pageno from upload_apar where emp_id='$id' AND status!='Inactive'");
        $rs = $query->result();
        foreach ($rs as $rss) {

            $sbid[] = $rss->pageno . "~" . $rss->startdate;
        }
        return implode(",", $sbid);
    }

    public function getallsessions($empid) {
        $query = $this->db->query("select startdate from upload_apar where emp_id='$empid' AND status!='Inactive' group by startdate");
        $rs = $query->result();
        return $rs;
    }

    public function getallservicebook($id) {
        $query = $this->db->query("select * from employee_service_book where status!='Inactive' and emp_id='$id' order by pageno asc");

        $rs = $query->result();
        return $rs;
    }

    public function getallleavereport($id) {
        $query = $this->db->query("select * from upload_emp_lr  where status!='Inactive' and emp_id='$id' order by pageno asc");
        $rs = $query->result();
        return $rs;
    }

    public function makeLogin($role, $email, $password) {
        $query = $this->db->query("insert into drm_login(user_name,password,role) values ('$email','" . md5($password) . "','$role')");
    }

    public function getdepartments() {
        $query = $this->db->query("select * from emp_department where status=1 order by name asc");
        $rs = $query->result();
        return $rs;
    }

    public function getdesignations() {
        $query = $this->db->query("select * from emp_designation where status=1 order by name asc");
        $rs = $query->result();
        return $rs;
    }

    public function get_sb_report_log($file_barcode, $doctype) {
//        if ($doctype == 'SB') {
//            $query = $this->db->query("select * from employee_service_book where emp_id='$empid' and status!='inactive' order by pageno");
//        }
//
//        if ($doctype == 'LR') {
//            $query = $this->db->query("select * from upload_emp_lr where emp_id='$empid' and status!='inactive' order by pageno");
//        }
//
//        if ($doctype == 'APAR') {
//            $query = $this->db->query("select * from upload_apar where emp_id='$empid' and status!='inactive' order by pageno");
//        }
//
//        if ($doctype == 'SR') {
//            $query = $this->db->query("select * from upload_sr where emp_id='$empid' and status!='inactive' order by pageno");
//        }
        if ($doctype == 'FILE') {
            $query = $this->db->query("select * from upload_file where file_barcode ='$file_barcode' and status!='inactive' order by pageno");
        }
        if ($doctype == 'MAP') {
            $query = $this->db->query("select * from upload_map where file_barcode ='$file_barcode' and status!='inactive' order by pageno");
        }

        $rs = $query->result();
        return $rs;
    }

    public function get_inactive($file_barcode, $pageno, $doctype) {
         /*switch ($doctype) {
           case 'SB':
                $table = 'employee_service_book';
                break;
            case 'LR':
                $table = 'upload_emp_lr';
                break;
            case 'APAR':
                $table = 'upload_apar';
                break;
            case 'SR':
                $table = 'upload_sr';
                break;
            case 'FILE':
                $table = 'upload_file';
                break;
            case 'MAP':
                $table = 'upload_map';
                break;
        }*/

        /*if ($doctype == 'SB') {
            $query = $this->db->query("select * from $table where emp_id='$emp_id' and pageno='$pageno' and status='inactive'");
        }

        if ($doctype == 'LR') {
            $query = $this->db->query("select * from $table where emp_id='$emp_id' and pageno='$pageno' and status!='inactive'");
        }

        if ($doctype == 'APAR') {
            $query = $this->db->query("select * from $table where emp_id='$emp_id' and pageno='$pageno' and status!='inactive'");
        }

        if ($doctype == 'SR') {
            $query = $this->db->query("select * from $table where emp_id='$emp_id' and pageno='$pageno' and status!='inactive'");
        }*/
        
        if ($doctype == 'FILE') {
            $query = $this->db->query("select * from upload_file where file_barcode ='$file_barcode' and pageno='$pageno' and status ='inactive'");
        }
        if ($doctype == 'MAP') {
            $query = $this->db->query("select * from upload_map where file_barcode = '$file_barcode' and pageno='$pageno' and status ='inactive'");
        }
        $rs = $query->result();
        return $rs;
    }

    public function get_table_id($type, $sb) {
        switch ($type) {
            /*case 'SB':
                $id = $sb->sb_id;
                break;
            case 'LR':
                $id = $sb->lr_id;
                break;
            case 'APAR':
                $id = $sb->id;
                break;
            case 'SR':
                $id = $sb->sr_id;
                break;*/
            case 'FILE':
                $id = $sb->file_id;
                break;
            case 'MAP':
                $id = $sb->map_id;
                break;
        }

        return $id;
    }

    public function search_employee($search) {
        $query = $this->db->select('*')->from('drm_employee')
                        ->where("employee_name LIKE '%$search%' or employee_code LIKE '%$search%'")->get();
        $rs = $query->result();
        return $rs;
    }

    public function search_employee_data($search, $limit, $start) {
        $sql = " SELECT ed.name as designation, edt.name as department, drm_employee.* from drm_employee ";
        $sql.= " LEFT JOIN emp_designation as ed ON ed.id = drm_employee.emp_designation";
        $sql.= " LEFT JOIN emp_department as edt ON edt.id = drm_employee.emp_department";
        $sql.= " where employee_name LIKE '%$search%' or employee_code LIKE '%$search%'";
        $sql.= " LIMIT $start, $limit";
    	$query = $this->db->query($sql);
    	$rs = $query->result();
    	return $rs;
    }

    public function search_employee_count($search) {
    	$sql = "select * from drm_employee where employee_name LIKE '%$search%' or employee_code LIKE '%$search%'";
    	$query = $this->db->query($sql);
    	$rs = $query->num_rows();
    	return $rs;
    }

    public function get_pdf_title($type) {
        switch ($type) {
            /*case 'SB':
                $title = 'SERVICE BOOK';
                break;
            case 'LR':
                $title = 'LEAVE REPORT';
                break;
            case 'APAR':
                $title = 'APAR REPORT';
                break;
            case 'SR':
                $title = 'SR ATTACHMENT';
                break;*/
            case 'FILE':
                $title = 'FILE';
                break;
            case 'MAP':
                $title = 'MAP';
                break;
        }

        return $title;
    }

    public function get_verification_id($emp_id, $type) {
        $result = $this->db->get_where('verification', array('emp_id' => $emp_id, 'doc_type' => $type))->row();
        if (count($result) > 0) {
            return $result->id;
        }
    }

    public function add_verification($data) {
        $result = $this->db->insert('verification', $data);
        return $result;
    }

    public function update_verification($data, $id) {
        $this->db->where('id', $id);
        $result = $this->db->update('verification', $data);
        return $result;
    }

    public function get_last_five_emps($search_term='',$limit, $start) {
        	
		// $sql = " SELECT ed.name as designation, drm_employee.* from drm_employee ";
  //       $sql.= " LEFT JOIN emp_designation as ed ON ed.id = drm_employee.emp_department";
  //       $sql.= " where employee_name LIKE '%$search%' or employee_code LIKE '%$search%'";
  //       $sql.= " LIMIT $start, $limit";


        $sql = "SELECT ed.name as designation, edt.name as department, drm_employee.* from drm_employee 
        LEFT JOIN emp_designation as ed ON ed.id = drm_employee.emp_designation 
        LEFT JOIN emp_department as edt ON edt.id = drm_employee.emp_department ";
        if($search_term!="all"){
            $sql.=" where employee_name LIKE '%$search_term%' or employee_code LIKE '%$search_term%' ";
        }
        $sql.="order by emp_id desc LIMIT $start, $limit";
        $query = $this->db->query($sql);
        $rs = $query->result();
        return $rs;
    }

    public function get_last_five_emps_count($search_term='') {
        
        $sql = "SELECT * from drm_employee ";
        if($search_term!="all"){
            $sql.=" where employee_name LIKE '%$search_term%' or employee_code LIKE '%$search_term%' ";
        }
        $sql.="order by emp_id desc";
        $query = $this->db->query($sql);
        $rs = $query->num_rows();
        return $rs;
    }

    public function view_records($table) {
        $query = $this->db->query("select * from drm_employee where emp_id in (select DISTINCT emp_id from $table where status!='Inactive')");
        $rs = $query->result();
        return $rs;
    }

    public function Get_employees_with_paging($limit, $start) {
        $offset = ($start - 1) * $limit;
        $this->db->limit($limit, $offset);

        $q = $this->db->select('*')
                        ->from('drm_employee AS t1')
                        ->where('t1.role', 3)
                        ->order_by('t1.emp_id', 'DESC')->get();
        if ($q->num_rows() > 0) {
            $results = $q->result();
            return $results;
        } else {
            return false;
        }
    }

    public function get_count_by_empcode($empcode) {
        $query = $this->db->query("select * from drm_employee where employee_code ='$empcode'");
        $num = $query->num_rows();
        return $num;
    }

    public function mark_upload_as_bulk($table, $insert_id) {
        switch ($table) {
            case 'employee_service_book':
                $this->db->query("update $table set bulk=1 where sb_id='$insert_id'");
                break;
            case 'upload_emp_lr':
                $this->db->query("update $table set bulk=1 where lr_id='$insert_id'");
                break;
            case 'upload_apar':
                //echo "update $table set bulk=1 where id='$insert_id'";exit;
                $this->db->query("update $table set bulk=1 where id='$insert_id'");
                break;
            case 'upload_attachment':
                $this->db->query("update $table set bulk=1 where id='$insert_id'");
                break;
        }
    }
    
    public function checkDuplicatePageNo($pageno, $empid){
        $query = $this->db->query("SELECT * FROM employee_service_book WHERE emp_id ='$empid' AND pageno = '$pageno'");
        $num = $query->num_rows();
        return $num;
    }
	
	public function checkDuplicateLRPageNo($pageno, $empid){
        $query = $this->db->query("SELECT * FROM upload_emp_lr WHERE emp_id ='$empid' AND pageno = '$pageno'");
        $num = $query->num_rows();
        return $num;
    }
	
	public function checkDuplicateAttachmentPageNo($pageno, $empid){
        $query = $this->db->query("SELECT * FROM upload_attachment WHERE emp_id ='$empid' AND pageno = '$pageno'");
        $num = $query->num_rows();
        return $num;
    }
	
	public function checkDuplicateAPARPageNo($pageno, $empid){
        $query = $this->db->query("SELECT * FROM upload_apar WHERE emp_id ='$empid' AND pageno = '$pageno'");
        $num = $query->num_rows();
        return $num;
    }
	
	public function loginLogReport($data) {
        $query = $this->db->query("INSERT INTO login_history SET user_id = '".$data['user_id']."', user_name = '".$data['user_name']."', role = '".$data['role']."', web = '".$data['web']."', mobile = '".$data['mobile']."', ip = '".$data['ip']."', data = '".$data['data']."', login_time = '".date('Y-m-d H:i:s')."', status = '1', created = '".date('Y-m-d H:i:s')."', modified = '".date('Y-m-d H:i:s')."'");
    }
	
	public function updateLoginHistory($data) {
        $query = $this->db->query("UPDATE login_history SET status = '1', logout_time = '".date('Y-m-d H:i:s')."', modified = '".date('Y-m-d H:i:s')."' WHERE id = '".$data."'");
    }
	
	public function getLoginHistoryCount($startdate='', $enddate='', $department=''){
		
		$sql = 'SELECT lh.user_id, lh.user_name, lh.role, lh.web, lh.mobile, lh.login_time, drmemp.employee_name, drmemp.emp_department, drmemp.emp_designation, drmemp.email FROM login_history as lh LEFT JOIN drm_employee as drmemp ON lh.user_id=drmemp.emp_id WHERE status = 1 AND lh.user_name!="admin"';
		
		if($startdate!='' && $enddate!=''){
			$sql .= " AND lh.created BETWEEN '$startdate' AND '$enddate'";
		}
		
		if($department!='all'){
			$sql.= " AND drmemp.emp_department = '$department'";
		}
		
		$query = $this->db->query($sql);
        $num = $query->num_rows();
        return $num;
	}
	
	public function getLoginHistory($startdate='', $enddate='', $department='', $limit, $start){
		//$query = $this->db->query("SELECT * FROM login_history GROUP BY user_id LIMIT $start, $limit");
		
		$sql = 'SELECT lh.user_id, lh.user_name, lh.role, lh.web, lh.mobile, lh.login_time, drmemp.employee_name, drmemp.emp_department, drmemp.emp_designation, drmemp.email FROM login_history as lh LEFT JOIN drm_employee as drmemp ON lh.user_id=drmemp.emp_id WHERE status = 1 AND lh.user_name!="admin"';
		
		if($startdate!='' && $enddate!=''){
			$sql .= " AND lh.created BETWEEN '$startdate' AND '$enddate'";
		}
		
		if($department!='all'){
			$sql.= " AND drmemp.emp_department = '$department'";
		}
		
		$sql.= " GROUP BY lh.user_id LIMIT $start, $limit";
		
		$query = $this->db->query($sql);
        $rs = $query->result();
        return $rs;
	}

    // himanshu audit start
    public function getAuditCount($startdate='', $enddate='', $department=''){
        
        $sql = 'SELECT ar.user_id, ar.user_name, ar.role, ar.link_name, ar.created, drmemp.employee_name, drmemp.emp_department, drmemp.emp_designation, drmemp.email FROM audit_report as ar LEFT JOIN drm_employee as drmemp ON ar.user_id=drmemp.emp_id WHERE status = 1 AND ar.user_name!="admin"';
        
        if($startdate!='' && $enddate!=''){
            $sql .= " AND ar.created BETWEEN '$startdate' AND '$enddate'";
        }
        
        if($department!='all'){
            $sql.= " AND drmemp.emp_department = '$department'";
        }
        
        $query = $this->db->query($sql);
        $num = $query->num_rows();
        return $num;
    }
    
    public function mobRegCount() {
        $sql = 'SELECT id from registration where isMobile = 1';
        $query = $this->db->query($sql);
        $num = $query->num_rows();
        return $num;
    }

    public function mobRegData() {
        $sql = 'SELECT r.id, r.employee_code, r.employee_name, de.emp_department, de.emp_designation, de.fathername, de.dob from registration r LEFT JOIN drm_employee as de ON de.employee_code = r.employee_code COLLATE utf8_unicode_ci where r.isMobile = 1 ';
        $query = $this->db->query($sql);
        $rs = $query->result();
        return $rs;
    }

    public function getAudit($startdate='', $enddate='', $department='', $limit, $start){
        //$query = $this->db->query("SELECT * FROM login_history GROUP BY user_id LIMIT $start, $limit");
        
        $sql = 'SELECT ar.user_id, ar.user_name, ar.role, ar.link_name, ar.created, drmemp.employee_name, drmemp.emp_department, drmemp.emp_designation, drmemp.email, drmemp.fathername, drmemp.dob FROM audit_report as ar LEFT JOIN drm_employee as drmemp ON ar.user_id=drmemp.emp_id WHERE status = 1 AND ar.user_name!="admin"';
        
        if($startdate!='' && $enddate!=''){
            $sql .= " AND ar.created BETWEEN '$startdate' AND '$enddate'";
        }
        
        if($department!='all'){
            $sql.= " AND drmemp.emp_department = '$department'";
        }
        
        $sql.= " GROUP BY ar.user_id LIMIT $start, $limit";
        
        $query = $this->db->query($sql);
        $rs = $query->result();
        return $rs;
    }

    public function getAuditExcel($startdate='', $enddate='', $department=''){
        
         $sql = 'SELECT ar.user_id, ar.user_name, ar.role, ar.link_name, ar.created, drmemp.employee_name, drmemp.emp_department, drmemp.emp_designation, drmemp.email FROM audit_report as ar LEFT JOIN drm_employee as drmemp ON ar.user_id=drmemp.emp_id WHERE status = 1 AND ar.user_name!="admin"';
        
        if($startdate!='' && $enddate!=''){
            $sql .= " AND ar.created BETWEEN '$startdate' AND '$enddate'";
        }
        
        if($department!='all'){
            $sql.= " AND drmemp.emp_department = '$department'";
        }
        
        $sql.= " GROUP BY ar.user_id";
        
        $query = $this->db->query($sql);
        $rs = $query->result();
        return $rs;
    }
    // himanshu audit end
	
	public function getUserDetail($userid){
		$query = $this->db->query("SELECT * FROM drm_employee WHERE employee_code = '".$userid."'");
        $rs = $query->result();
        return $rs;
	}
	
	public function getUserDetailByID($userid){
		
        $query = $this->db->query("SELECT * FROM drm_employee WHERE emp_id = '".$userid."'");
        $rs = $query->result();
        return $rs;
	}
	
	public function getDepartmentNamebyID($departid){
		$query = $this->db->query("SELECT name FROM emp_department WHERE id = '".$departid."'");
        $rs = $query->result();
        return $rs;
	}
	
	public function getDesignationNamebyID($desigid){
		$query = $this->db->query("SELECT name FROM emp_designation WHERE id = '".$desigid."'");
        $rs = $query->result();
        return $rs;
	}
	
	public function getTotalLoginCount($userid){
		$sql = "SELECT * FROM login_history WHERE user_id = '$userid' AND user_name !='admin'";
		$query = $this->db->query($sql);
        $num = $query->num_rows();
        return $num;
	}
	
	public function getTotalLoginDetailHistoryCount($startdate='', $enddate='', $department='', $userid){
		
		$sql = "SELECT lh.user_id, lh.user_name, lh.role, lh.web, lh.mobile, lh.login_time, drmemp.employee_name, drmemp.emp_department, drmemp.emp_designation, drmemp.email FROM login_history as lh LEFT JOIN drm_employee as drmemp ON lh.user_id=drmemp.emp_id WHERE lh.status = 1 AND lh.user_id = '$userid' AND lh.user_name != 'admin'";
		
		if($startdate!='' && $enddate!=''){
			$sql .= " AND lh.created BETWEEN '$startdate' AND '$enddate'";
		}
		
		if($department!='all'){
			$sql.= " AND drmemp.emp_department = '$department'";
		}
		
		$query = $this->db->query($sql);
        $num = $query->num_rows();
        return $num;
	}
	
	public function getDetailLoginReport($startdate='', $enddate='', $department='', $userid, $limit, $start){
		
		$sql = "SELECT lh.user_id, lh.employee_code, lh.user_name, lh.role, lh.web, lh.mobile, lh.login_time, drmemp.employee_name, drmemp.emp_department, drmemp.emp_designation, drmemp.email FROM login_history as lh LEFT JOIN drm_employee as drmemp ON lh.user_id=drmemp.emp_id WHERE lh.status = 1 AND lh.user_id = '$userid' AND lh.user_name != 'admin'";
		
		if($startdate!='' && $enddate!=''){
			$sql .= " AND lh.created BETWEEN '$startdate' AND '$enddate'";
		}
		
		if($department!='all'){
			$sql.= " AND drmemp.emp_department = '$department'";
		}
		
		$sql.= " LIMIT $start, $limit";
				
		$query = $this->db->query($sql);
        $rs = $query->result();
        return $rs;
	}
	
	public function getAllEmployeeList($limit, $start){		
		$query = $this->db->query("SELECT * FROM drm_employee LIMIT $start, $limit");
        $rs = $query->result();
        return $rs;		
	}
    // Summary himanshu Start
    public function getSR_SummarybyDept($department='') {
        $sql = 'SELECT sum(sr) as sr_count from employee_document';
        if($department!='all'){
            $sql.= " where department = '$department'";
        }
        // $sql.= " group by esb.emp_id";
        $query = $this->db->query($sql);
        $rs = $query->result();
        return $rs;  
    }

    public function getSR_CountbyDept($department='') {
    	$sql = 'SELECT count(sr) as sr_count from employee_document';
        if($department!='all'){
            $sql.= " where department = '$department' and sr > 0";
        }else{
        	$sql.= " where sr > 0";
        }
//         echo $sql;exit;
        $query = $this->db->query($sql);
        $rs = $query->result();
        return $rs;  
    }

    public function getLR_SummarybyDept($department='') {
        $sql = 'SELECT sum(lr) as lr_count from employee_document';
        if($department!='all'){
            $sql.= " where department = '$department'";
        }
        // $sql.= " group by uel.emp_id";
        $query = $this->db->query($sql);
        $rs = $query->result();
        return $rs;  
    }

    public function getLR_CountbyDept($department='') {
    	$sql = 'SELECT count(sr) as lr_count from employee_document';
        if($department!='all'){
            $sql.= " where department = '$department' and lr > 0";
        }else{
        	$sql.= " where lr > 0";
        }
        // $sql.= " group by esb.emp_id";
        $query = $this->db->query($sql);
        $rs = $query->result();
        return $rs;  
    }

    public function getAt_CountbyDept($department='') {
    	$sql = 'SELECT count(attachment) as attach_count from employee_document';
        if($department!='all'){
            $sql.= " where department = '$department' and attachment > 0";
        }else{
        	$sql.= " where attachment > 0";
        }
        // $sql.= " group by esb.emp_id";
        $query = $this->db->query($sql);
        $rs = $query->result();
        return $rs;  
    }

    public function get_employee_document_data($employee_id="") {
    	$sql = "SELECT apar from employee_document where employee_id = $employee_id";
    	$query = $this->db->query($sql);
        $rs = $query->row();
        return $rs;  
    }

    public function getAttach_SummarybyDept($department='') {
        $sql = 'SELECT sum(attachment) as attach_count from employee_document';
        if($department!='all'){
            $sql.= " where department = '$department'";
        }
        // $sql.= " group by uel.emp_id";
        $query = $this->db->query($sql);
        $rs = $query->result();
        return $rs;  
    }

    public function getApar_SummarybyDept($department='') {
        $sql = 'SELECT apar from employee_document';
        if($department!='all'){
            $sql.= " where department = '$department' and apar != '0'";
        }else{
            $sql.= " where apar != '0'";
        }
		/* print_r($sql);
		   exit; */
        //echo $sql;exit;
        $query = $this->db->query($sql);
        $rs = $query->result();
        return $rs;  
    }

    // Summary Himanshu End
    public function getEmployeeList($department='', $limit, $start){       
        $sql = "SELECT * FROM drm_employee"    ;
        if($department!='all'){
            $sql.= " where emp_department = '$department'";
        }
        $sql.= " LIMIT $start, $limit";
        $query = $this->db->query($sql);
        $rs = $query->result();
        return $rs;     
    }

    public function getEmployeeExcel($department=''){       
        $sql = "SELECT emp_department,emp_designation,emp_id,employee_name FROM drm_employee";
        if($department!='all'){
            $sql.= " where emp_department = '$department'";
        }
        // $sql.=" LIMIT 5000";
        $query = $this->db->query($sql);
        $rs = $query->result();
        return $rs;     
    }

    public function getEmployeeExcelFromTemp($departmentName=''){       
        $sql = "SELECT * FROM employee_document";

        if($departmentName!='all'){
            $name = $departmentName[0]->name;
            $sql.= " where department = '$name'";
        }
        // $sql.=" LIMIT 1";
        $query = $this->db->query($sql);
        $rs = $query->result();
        return $rs;     
    }
	
    public function getAllEmployeeCount(){		
        $query = $this->db->query("SELECT * FROM drm_employee");
        //echo $this->db->last_query();exit;
        $num = $query->num_rows();
        return $num;	
    }

    public function getEmployeeCount($department=''){        
        $sql = "SELECT * FROM drm_employee";
        if($department!='all'){
            $sql.= " where drm_employee.emp_department = '$department'";
        }
        // print_r($department);
        // exit;
        $query = $this->db->query($sql);
        $num = $query->num_rows();
        return $num;    
    }
	
    public function getEmployeeSRcount($emp_id){
        $query = $this->db->query("SELECT * FROM employee_service_book WHERE emp_id = '$emp_id' AND status=''");
        $num = $query->num_rows();
        return $num;
    }

    public function getEmployeeSRcountExcel($emp_id){
        //echo "SELECT emp_id FROM employee_service_book WHERE emp_id = '$emp_id' AND status=''";
        //echo '<br>';


       $query = $this->db->query("SELECT emp_id FROM employee_service_book WHERE emp_id = '$emp_id' AND status=''");
       $num = $query->num_rows();
       return $num;
    }
	
	public function getEmployeeLRcount($emp_id){
		$query = $this->db->query("SELECT * FROM upload_emp_lr WHERE emp_id = '$emp_id' AND status=''");
        $num = $query->num_rows();
        return $num;
	}

    public function getEmployeeLRcountExcel($emp_id){
        $query = $this->db->query("SELECT emp_id FROM upload_emp_lr WHERE emp_id = '$emp_id' AND status=''");
        $num = $query->num_rows();
        return $num;
    }
	
	public function getEmployeeAttachmentcountExcel($emp_id){
		$query = $this->db->query("SELECT emp_id FROM upload_attachment WHERE emp_id = '$emp_id' AND status=''");
        $num = $query->num_rows();
        return $num;
	}

    public function getEmployeeAttachmentcount($emp_id){
        $query = $this->db->query("SELECT * FROM upload_attachment WHERE emp_id = '$emp_id' AND status=''");
        $num = $query->num_rows();
        return $num;
    }
	
    public function getEmployeeAparcount($emp_id){
        $query = $this->db->query("SELECT count(*) as totalcount, startdate FROM upload_apar WHERE emp_id = '$emp_id' AND status='' GROUP BY startdate");
        $rs = $query->result();
        return $rs;
    }

    public function getEmployeeAparcountexcel($emp_id){
        $query = $this->db->query("SELECT count(*) as totalcount, startdate FROM upload_apar WHERE emp_id = '$emp_id' AND status='' GROUP BY startdate");
        $rs = $query->result();
        return $rs;
    }
	
	public function getNotUpdateSrEmployeeOneYearCount($startdate, $enddate, $department){		
		//$query = $this->db->query("SELECT emp_id FROM employee_service_book WHERE uploaded_at < '$date' AND status='' GROUP BY emp_id");
		$sql = "SELECT drmemp.employee_code , esb.emp_id, drmemp.employee_name, drmemp.emp_department, drmemp.emp_designation, drmemp.email FROM employee_service_book as esb LEFT JOIN drm_employee as drmemp ON esb.emp_id=drmemp.emp_id WHERE esb.status='' AND esb.uploaded_at NOT BETWEEN '$startdate' AND '$enddate'";
		
		if($department!='all'){
			$sql.= " AND drmemp.emp_department = '$department'";
		}
		$sql.= " GROUP BY esb.emp_id";		
		
		$query = $this->db->query($sql);
		
        $num = $query->num_rows();
        return $num;
	}
	
	public function getNotUpdateSrEmployeeOneYear($startdate, $enddate, $department, $limit, $start){
		//echo "SELECT emp_id FROM employee_service_book WHERE uploaded_at < '$date' AND status='' GROUP BY emp_id LIMIT $start, $limit";
		//$query = $this->db->query("SELECT emp_id FROM employee_service_book WHERE uploaded_at < '$date' AND status='' GROUP BY emp_id LIMIT $start, $limit");
		
		$sql = "SELECT drmemp.employee_code, esb.emp_id, drmemp.employee_name, drmemp.emp_department, drmemp.emp_designation, drmemp.email, drmemp.fathername, drmemp.dob FROM employee_service_book as esb LEFT JOIN drm_employee as drmemp ON esb.emp_id=drmemp.emp_id WHERE esb.status='' AND esb.uploaded_at NOT BETWEEN '$startdate' AND '$enddate'";
		
		if($department!='all'){
			$sql.= " AND drmemp.emp_department = '$department'";
		}
		$sql.= " GROUP BY esb.emp_id LIMIT $start, $limit";		
		
		$query = $this->db->query($sql);
		
        $rs = $query->result();
        return $rs;
	}
	
	public function getNotUpdateAparEmployeeOneYearCount($startdate, $enddate, $department){		
		//$query = $this->db->query("SELECT emp_id FROM upload_apar WHERE uploaded_at < '$date' AND status='' GROUP BY emp_id");
		
		$sql = "SELECT esb.emp_id, drmemp.employee_code, drmemp.employee_name, drmemp.emp_department, drmemp.emp_designation, drmemp.email FROM upload_apar as esb LEFT JOIN drm_employee as drmemp ON esb.emp_id=drmemp.emp_id WHERE esb.status='' AND esb.uploaded_at NOT BETWEEN '$startdate' AND '$enddate'";
		
		if($department!='all'){
			$sql.= " AND drmemp.emp_department = '$department'";
		}
		$sql.= " GROUP BY esb.emp_id";		
		
		$query = $this->db->query($sql);
		
        $num = $query->num_rows();
        return $num;
	}
	
	public function getNotUpdateAparEmployeeOneYear($startdate, $enddate, $department, $limit, $start){
		
		//$query = $this->db->query("SELECT emp_id FROM upload_apar WHERE uploaded_at < '$date' AND status='' GROUP BY emp_id LIMIT $start, $limit");
		
		$sql = "SELECT esb.emp_id, drmemp.employee_name, drmemp.employee_code, drmemp.emp_department, drmemp.emp_designation, drmemp.email, drmemp.fathername, drmemp.dob FROM upload_apar as esb LEFT JOIN drm_employee as drmemp ON esb.emp_id=drmemp.emp_id WHERE esb.status='' AND esb.uploaded_at NOT BETWEEN '$startdate' AND '$enddate'";
		
		if($department!='all'){
			$sql.= " AND drmemp.emp_department = '$department'";
		}
		$sql.= " GROUP BY esb.emp_id LIMIT $start, $limit";		
		
		$query = $this->db->query($sql);
		
        $rs = $query->result();
        return $rs;
	}
	
	public function getNotUpdateLrEmployeeOneYearCount($startdate, $enddate, $department){	
		//$query = $this->db->query("SELECT emp_id FROM upload_emp_lr WHERE uploaded_at NOT BETWEEN '$startdate' AND '$enddate' AND status='' GROUP BY emp_id");
		
		$sql = "SELECT esb.emp_id, drmemp.employee_code, drmemp.employee_name, drmemp.emp_department, drmemp.emp_designation, drmemp.email FROM upload_emp_lr as esb LEFT JOIN drm_employee as drmemp ON esb.emp_id=drmemp.emp_id WHERE esb.status='' AND esb.uploaded_at NOT BETWEEN '$startdate' AND '$enddate'";
		
		if($department!='all'){
			$sql.= " AND drmemp.emp_department = '$department'";
		}
		$sql.= " GROUP BY esb.emp_id";		
		
		$query = $this->db->query($sql);
		
		
        $num = $query->num_rows();
        return $num;
	}
	
	public function getNotUpdateLrEmployeeOneYear($startdate, $enddate, $department, $limit, $start){
		
		//$query = $this->db->query("SELECT emp_id FROM upload_emp_lr WHERE uploaded_at NOT BETWEEN '$startdate' AND '$enddate' AND status='' GROUP BY emp_id LIMIT $start, $limit");
		
		$sql = "SELECT esb.emp_id, drmemp.employee_code, drmemp.employee_name, drmemp.emp_department, drmemp.emp_designation, drmemp.email, drmemp.fathername, drmemp.dob FROM upload_emp_lr as esb LEFT JOIN drm_employee as drmemp ON esb.emp_id=drmemp.emp_id WHERE esb.status='' AND esb.uploaded_at NOT BETWEEN '$startdate' AND '$enddate'";
		
		if($department!='all'){
			$sql.= " AND drmemp.emp_department = '$department'";
		}
		$sql.= " GROUP BY esb.emp_id LIMIT $start, $limit";		
		
		$query = $this->db->query($sql);
		
        $rs = $query->result();
        return $rs;
	}
	
	public function getUpdateSrEmployeeOneYearCount($startdate, $enddate, $department){		
		
		$sql = "SELECT esb.emp_id, drmemp.employee_name, drmemp.emp_department, drmemp.emp_designation, drmemp.email FROM employee_service_book as esb LEFT JOIN drm_employee as drmemp ON esb.emp_id=drmemp.emp_id WHERE esb.status='' AND esb.uploaded_at BETWEEN '$startdate' AND '$enddate'";
		
		if($department!='all'){
			$sql.= " AND drmemp.emp_department = '$department'";
		}
		$sql.= " GROUP BY esb.emp_id";		
		
		$query = $this->db->query($sql);
		
        $num = $query->num_rows();
        return $num;
	}
	
	public function getUpdateSrEmployeeOneYear($startdate, $enddate, $department, $limit, $start){		
		
		//$query = $this->db->query("SELECT emp_id FROM employee_service_book WHERE uploaded_at BETWEEN '$startdate' AND '$enddate' AND status='' GROUP BY emp_id LIMIT $start, $limit");
		
		$sql = "SELECT esb.emp_id, drmemp.employee_name, drmemp.employee_code, drmemp.emp_department, drmemp.emp_designation, drmemp.email, drmemp.fathername, drmemp.dob FROM employee_service_book as esb LEFT JOIN drm_employee as drmemp ON esb.emp_id=drmemp.emp_id WHERE esb.status='' AND esb.uploaded_at BETWEEN '$startdate' AND '$enddate'";
		
		if($department!='all'){
			$sql.= " AND drmemp.emp_department = '$department'";
		}
		$sql.= " GROUP BY esb.emp_id LIMIT $start, $limit";		
		
		$query = $this->db->query($sql);
        $rs = $query->result();
        return $rs;
	}
	
	public function getUpdateLrEmployeeOneYearCount($startdate, $enddate, $department){		
		//$query = $this->db->query("SELECT emp_id FROM upload_emp_lr WHERE uploaded_at BETWEEN '$startdate' AND '$enddate' AND status='' GROUP BY emp_id");
		
		$sql = "SELECT esb.emp_id, drmemp.employee_name, drmemp.emp_department, drmemp.emp_designation, drmemp.email FROM upload_emp_lr as esb LEFT JOIN drm_employee as drmemp ON esb.emp_id=drmemp.emp_id WHERE esb.status='' AND esb.uploaded_at BETWEEN '$startdate' AND '$enddate'";
		
		if($department!='all'){
			$sql.= " AND drmemp.emp_department = '$department'";
		}
		$sql.= " GROUP BY esb.emp_id";		
		
		$query = $this->db->query($sql);
		
        $num = $query->num_rows();
        return $num;
	}
	
	public function getUpdateLrEmployeeOneYear($startdate, $enddate, $department, $limit, $start){
		
		//$query = $this->db->query("SELECT emp_id FROM upload_emp_lr WHERE uploaded_at BETWEEN '$startdate' AND '$enddate' AND status='' GROUP BY emp_id LIMIT $start, $limit");
		
		$sql = "SELECT esb.emp_id, drmemp.employee_name, drmemp.employee_code, drmemp.emp_department, drmemp.emp_designation, drmemp.email, drmemp.fathername, drmemp.dob FROM upload_emp_lr as esb LEFT JOIN drm_employee as drmemp ON esb.emp_id=drmemp.emp_id WHERE esb.status='' AND esb.uploaded_at BETWEEN '$startdate' AND '$enddate'";
		
		if($department!='all'){
			$sql.= " AND drmemp.emp_department = '$department'";
		}
		$sql.= " GROUP BY esb.emp_id LIMIT $start, $limit";		
		
		$query = $this->db->query($sql);
		
        $rs = $query->result();
        return $rs;
	}
	
	public function getUpdateAparEmployeeOneYearCount($startdate, $enddate, $department){		
		//$query = $this->db->query("SELECT emp_id FROM upload_apar WHERE uploaded_at BETWEEN '$startdate' AND '$enddate' AND status='' GROUP BY emp_id");
		
		$sql = "SELECT esb.emp_id, drmemp.employee_name, drmemp.emp_department, drmemp.emp_designation, drmemp.email FROM upload_apar as esb LEFT JOIN drm_employee as drmemp ON esb.emp_id=drmemp.emp_id WHERE esb.status='' AND esb.uploaded_at BETWEEN '$startdate' AND '$enddate'";
		
		if($department!='all'){
			$sql.= " AND drmemp.emp_department = '$department'";
		}
		$sql.= " GROUP BY esb.emp_id";		
		
		$query = $this->db->query($sql);
		
        $num = $query->num_rows();
        return $num;
	}
	
	public function getUpdateAparEmployeeOneYear($startdate, $enddate, $department, $limit, $start){
		
		//$query = $this->db->query("SELECT emp_id FROM upload_apar WHERE uploaded_at BETWEEN '$startdate' AND '$enddate' AND status='' GROUP BY emp_id LIMIT $start, $limit");
		
		$sql = "SELECT esb.emp_id, drmemp.employee_name,drmemp.employee_code, drmemp.emp_department, drmemp.emp_designation, drmemp.email, drmemp.fathername, drmemp.dob FROM upload_apar as esb LEFT JOIN drm_employee as drmemp ON esb.emp_id=drmemp.emp_id WHERE esb.status='' AND esb.uploaded_at BETWEEN '$startdate' AND '$enddate'";
		
		if($department!='all'){
			$sql.= " AND drmemp.emp_department = '$department'";
		}
		$sql.= " GROUP BY esb.emp_id LIMIT $start, $limit";		
		
		$query = $this->db->query($sql);		
		
        $rs = $query->result();
        return $rs;
	}
	
	public function getRoleName($role){
		$query = $this->db->query("SELECT name FROM emp_designation WHERE id = '".$desigid."'");
        $rs = $query->result();
        return $rs;
	}
	
	public function compress($source, $destination, $quality) {

		$info = getimagesize($source);
		if ($info['mime'] == 'image/jpeg') 
			$image = imagecreatefromjpeg($source);
		elseif ($info['mime'] == 'image/gif') 
			$image = imagecreatefromgif($source);
		elseif ($info['mime'] == 'image/png') 
			$image = imagecreatefrompng($source);
			
		imagejpeg($image, $destination, $quality);
        // move_uploaded_file($image, $destination);
		return $destination;
	}
	
	public function getLoginHistoryExcel($startdate='', $enddate='', $department=''){
		
		$sql = 'SELECT lh.user_id, lh.user_name, lh.role, lh.web, lh.mobile, lh.login_time, drmemp.employee_name, drmemp.emp_department, drmemp.employee_code, drmemp.emp_designation, drmemp.email FROM login_history as lh LEFT JOIN drm_employee as drmemp ON lh.user_id=drmemp.emp_id WHERE status = 1 AND lh.user_name != "admin"';
		
		if($startdate!='' && $enddate!=''){
			$sql .= " AND lh.created BETWEEN '$startdate' AND '$enddate'";
		}
		
		if($department!='all'){
			$sql.= " AND drmemp.emp_department = '$department'";
		}
		
		$sql.= " GROUP BY lh.user_id";
		
		$query = $this->db->query($sql);
        $rs = $query->result();
        return $rs;
	}
	
	public function getDetailLoginHistoryExcel($startdate='', $enddate='', $department='', $userid=''){
		$sql = 'SELECT lh.user_id, lh.user_name, lh.role, lh.web, lh.mobile, lh.login_time, drmemp.employee_name, drmemp.emp_department, drmemp.emp_designation, drmemp.email FROM login_history as lh LEFT JOIN drm_employee as drmemp ON lh.user_id=drmemp.emp_id WHERE status = 1 AND lh.user_name != "admin" AND lh.user_id = "'.$userid.'"';
		
		if($startdate!='' && $enddate!=''){
			$sql .= " AND lh.created BETWEEN '$startdate' AND '$enddate'";
		}
		
		if($department!='all'){
			$sql.= " AND drmemp.emp_department = '$department'";
		}
		
		
		//echo $sql;exit;
		$query = $this->db->query($sql);
        $rs = $query->result();
        return $rs;
	}
	
	public function noupdatereportexcelreport ($startdate, $enddate, $department, $tabname)
	{
		if($tabname == 'sr'){
			$table = 'employee_service_book';
		}
		
		if($tabname == 'lr'){
			$table = 'upload_emp_lr';
		}
		
		if($tabname == 'apar'){
			$table = 'upload_apar';
		}
		
		$sql = "SELECT esb.emp_id, drmemp.employee_name,drmemp.employee_code, drmemp.emp_department, drmemp.emp_designation, drmemp.email FROM $table as esb LEFT JOIN drm_employee as drmemp ON esb.emp_id=drmemp.emp_id WHERE esb.status='' AND esb.uploaded_at NOT BETWEEN '$startdate' AND '$enddate'";
		
		if($department!='all'){
			$sql.= " AND drmemp.emp_department = '$department'";
		}
		$sql.= " GROUP BY esb.emp_id";
		//echo $sql;exit;
		$query = $this->db->query($sql);
		
        $rs = $query->result();
        return $rs;
	}
	
	public function updatereportexcelreport ($startdate, $enddate, $department, $tabname)
	{
		if($tabname == 'sr'){
			$table = 'employee_service_book';
		}
		
		if($tabname == 'lr'){
			$table = 'upload_emp_lr';
		}
		
		if($tabname == 'apar'){
			$table = 'upload_apar';
		}
		
		$sql = "SELECT esb.emp_id, drmemp.employee_name, drmemp.emp_department, drmemp.emp_designation, drmemp.email FROM $table as esb LEFT JOIN drm_employee as drmemp ON esb.emp_id=drmemp.emp_id WHERE esb.status='' AND esb.uploaded_at BETWEEN '$startdate' AND '$enddate'";
		
		if($department!='all'){
			$sql.= " AND drmemp.emp_department = '$department'";
		}
		$sql.= " GROUP BY esb.emp_id";
		//echo $sql;exit;
		$query = $this->db->query($sql);
		
        $rs = $query->result();
        return $rs;
	}
    public function employee_document(){
        $sql = 'select employee_id from employee_document where isupdated = 0 limit 1';
        $query = $this->db->query($sql);
        $rs = $query->row();
        return $rs;
    }
    public function update_employee_records($empID, $srcount, $lrcount, $attachmentcount, $acount) {

        $this->db->query("update employee_document set sr='$srcount', lr='$lrcount', apar='$acount', attachment='$attachmentcount' where employee_id='$empID'");

        $this->db->query("update employee_document set isupdated=1 where employee_id='$empID'");

    }
    public function getOtpNotSubmittedCount($mobile="",$pfnumber="") {
        $sql = "select * from registration where isMobile = 1 and status = 0 ";
        if($mobile!="all") {
            $sql.= " and mobile LIKE '%$mobile%'";
        }
        if($pfnumber!="all") {
            $sql.=" and employee_code LIKE '%$pfnumber%'";
        }
        $query = $this->db->query($sql);
        $num = $query->num_rows();
        return $num;
    }

    public function getOtpNotSubmitted($mobile="", $pfnumber="", $limit, $start) {
        $sql = "select * from registration where isMobile = 1 and status = 0 ";
        if($mobile!="all") {
            $sql.= " and mobile LIKE '%$mobile%'";
        }
        if($pfnumber!="all") {
            $sql.=" and employee_code LIKE '%$pfnumber%'";
        }
        $sql.= " LIMIT $start, $limit";
        // print_r($sql);
        // exit;
        $query = $this->db->query($sql);
        $num = $query->result();
        return $num;
    }

    public function getOtpNotSubmittedExcel($mobile="", $pfnumber="") {
        $sql = "select * from registration where isMobile = 1 and status = 0 ";
        if($mobile!="all") {
            $sql.= " and mobile LIKE '%$mobile%'";
        }
        if($pfnumber!="all") {
            $sql.=" and employee_code LIKE '%$pfnumber%'";
        }
        // $sql.= " GROUP BY employee_code LIMIT $start, $limit";
        // print_r($sql);
        // exit;
        $query = $this->db->query($sql);
        $num = $query->result();
        return $num;
    }
	
    public function checkEmp($empid){
        $sql = "SELECT * FROM employee_document WHERE employee_id = '$empid' ";
        //echo $sql;exit;
        $query = $this->db->query($sql);
        $num = $query->num_rows();
        return $num;
    }
    
    public function getEmployeeAPARCount_nw($emp_id){
        $query = $this->db->query("SELECT COUNT(*)as total FROM upload_apar WHERE emp_id = '$emp_id' AND status=''");
        $num = $query->result();
        return $num['0'];
    }
	
	public function GetSrAllActive(){
		
		$query = $this->db->query("SELECT * FROM employee_service_book WHERE employee_service_book.status = ''");
        $num = $query->num_rows();
        return $num;
		
	}
	public function GetSrAllActiveGroupByID(){
		
		$query = $this->db->query("SELECT * FROM employee_service_book WHERE employee_service_book.status = '' GROUP BY employee_service_book.emp_id");
        $num = $query->num_rows();
        return $num;
		
	}
	public function GetLrAllActive(){
		
		$query = $this->db->query("SELECT * FROM upload_emp_lr WHERE upload_emp_lr.status = '' ");
        $num = $query->num_rows();
        return $num;
		
	}
	public function GetLrAllActiveGroupByID(){
		
		$query = $this->db->query("SELECT * FROM upload_emp_lr WHERE upload_emp_lr.status = '' GROUP BY upload_emp_lr.emp_id");
        $num = $query->num_rows();
        return $num;
		
	}
	public function GetAttAllActive(){
		
		$query = $this->db->query("SELECT * FROM upload_attachment WHERE upload_attachment.status = ''");
        $num = $query->num_rows();
        return $num;
		
	}
	public function GetAttAllActiveGroupByID(){
		
		$query = $this->db->query("SELECT * FROM upload_attachment WHERE upload_attachment.status = '' GROUP BY upload_attachment.emp_id");
        $num = $query->num_rows();
        return $num;
		
	}
	public function GetUploadAllActive(){
		
		$query = $this->db->query("SELECT COUNT(upload_apar.filename) AS countFile , upload_apar.startdate FROM upload_apar WHERE upload_apar.status = ''
GROUP BY upload_apar.startdate
ORDER BY upload_apar.startdate DESC");
        $num = $query->result();
        return $num;
		
	}
	public function GetUploadAllActiveByStart($StartDate){
		
		$query = $this->db->query("SELECT COUNT(upload_apar.filename) AS countFile , upload_apar.startdate FROM upload_apar WHERE upload_apar.status = ''
AND upload_apar.startdate = '".$StartDate."'");
        $num = $query->row();
        return $num;
		
	}
	public function GetUploadAllActiveByStartGR($StartDate){
		
		$query = $this->db->query("SELECT * FROM upload_apar WHERE upload_apar.status = ''
AND upload_apar.startdate = '".$StartDate."' GROUP BY upload_apar.emp_id");
        $num = $query->result();
        return $num;
		
	}
	
	public function GetUserSrByEmpID($ID){
		
		$query = $this->db->query("SELECT * FROM employee_service_book WHERE employee_service_book.emp_id = $ID AND employee_service_book.status = '' ");
        $num = $query->result();
        return $num;
		
	}
	public function GetUserLrByEmpID($ID){
		
		$query = $this->db->query("SELECT * FROM  upload_emp_lr WHERE upload_emp_lr.emp_id = $ID AND upload_emp_lr.status = ''");
        $num = $query->result();
        return $num;
		
	}
	
	public function GetUploadByEmpIdAllActive($yr,$EID){
		
		$query = $this->db->query("SELECT * FROM upload_apar WHERE upload_apar.status = ''
AND upload_apar.startdate = $yr
AND upload_apar.emp_id = $EID");
        $num = $query->result();
        return $num;
		
	}
	
	public function GetAllUserByLimit($Start){
		
		$query = $this->db->query("SELECT * FROM drm_employee LIMIT $Start,2000");
        $num = $query->result();
        return $num;
		
	}
	
	public function GetAttAllActiveGroupByIdEmp($EID){
		
		$query = $this->db->query("SELECT * FROM upload_attachment WHERE upload_attachment.status = '' AND upload_attachment.emp_id = $EID");
        $num = $query->result();
        return $num;
		
	}
	
	public function CheckDataExits($EID){
		$query = $this->db->query("SELECT * FROM employee_document WHERE employee_document.employee_id = $EID");
        $num = $query->result();
        return $num;
	}
	
	public function UpdateEmpDocment($empId,$data){
		
		$this->db->where('employee_id',$empId);
		$result = $this->db->update('employee_document',$data);
		return $result;
		
	}
	
	public function InsertEmpDocment($data){
		$result = $this->db->insert('employee_document',$data);
		return $result;
		
	}
	/* FILE FUNCTION - 09-02-2021 */
        public function getEmployeeFilecount($emp_id){
            $query = $this->db->query("SELECT * FROM upload_file WHERE emp_id = '$emp_id' AND status=''");
            $num = $query->num_rows();
            return $num;
        }

        public function getEmployeeFilecountExcel($emp_id){
           $query = $this->db->query("SELECT emp_id FROM upload_file WHERE emp_id = '$emp_id' AND status=''");
           $num = $query->num_rows();
           return $num;
        }
        public function deletefile($id) {
            $query = $this->db->query("select * from upload_file where file_id='$id'");
            $rs = $query->result();
//            unlink("uploads/" . $this->User_model->getsingleemployee($rs[0]->emp_id)->employee_code . "/service_book/" . $rs[0]->filename);
            unlink("uploads/" . $this->User_model->getsingleemployee($rs[0]->emp_id)->employee_code . "/files/" . $rs[0]->filename);
            $this->db->query("delete from upload_file where file_id='$id'");
        }
        
        public function savefilecopy($file_barcode, $newfile_name, $pageno, $version) {
            if ($version > 1) {
                $this->db->query("update upload_file set status='Inactive' where pageno='$pageno' and file_barcode='$file_barcode'");
            }
            $query = $this->db->query("insert into upload_file (file_barcode, filename, pageno,version) values ('$file_barcode','$newfile_name','$pageno','$version')");
            return $query;
        }
        public function getPagerVersionFileCopy($file_barcode, $pageno) {
            $query = $this->db->query("select * from upload_file where file_barcode='$file_barcode' and pageno='$pageno'");
            $rs = $query->result();
            return count($rs) + 1;
        }
        public function checkDuplicateFilePageNo($pageno, $file_barcode){
            $query = $this->db->query("SELECT * FROM upload_file WHERE file_barcode='$file_barcode' AND pageno = '$pageno'");
            $num = $query->num_rows();
            return $num;
        }
        public function getFiledetail($file_barcode) {
            $query = $this->db->query("select * from upload_file where file_barcode='$file_barcode' and status!='Inactive' order by pageno asc");
            $rs = $query->result();
            return $rs;
        }
        public function deleteFileCopy($id) {
            $query = $this->db->query("select * from upload_file where file_id ='$id'");
            $rs = $query->row();
            unlink("uploads/" . $rs->file_barcode . "/files/" . $rs->filename);
            $this->db->query("delete from upload_file where file_id='$id'");
        }
        public function getallFileCopy($file_barcode) {
            $query = $this->db->query("select * from upload_file where status!='Inactive' and file_barcode='$file_barcode' order by pageno asc");
            $rs = $query->result();
            return $rs;
        }
        public function file_copy_count() {
            $query = $this->db->query("select COUNT(DISTINCT file_barcode) AS mycount from upload_file where status!='Inactive'");
            $rs = $query->row();
            return $rs;
        }
        
        /* UPLOAD MAP DATA - 10-02-2021 */
        public function map_count() {
            $query = $this->db->query("select COUNT(DISTINCT file_barcode) AS mycount from upload_map where status!='Inactive'");
            $rs = $query->row();
            return $rs;
        }
        public function getalluploadedmapid($file_barcode) {
            $sbid = array();
            $query = $this->db->query("select pageno from upload_map where file_barcode='$file_barcode' AND status!='Inactive'");
            $rs = $query->result();
            foreach ($rs as $rss) {
                $sbid[] = $rss->pageno;
            }
            return implode(",", $sbid);
        }
        public function getMAPdetail($file_barcode) {
            $query = $this->db->query("select * from upload_map where file_barcode='$file_barcode' and status!='Inactive' order by pageno asc");
            $rs = $query->result();
            return $rs;
        }
        public function checkDuplicateMapNo($pageno, $file_barcode){
            $query = $this->db->query("SELECT * FROM upload_map WHERE file_barcode='$file_barcode' AND pageno = '$pageno'");
            $num = $query->num_rows();
            return $num;
        }
        public function savemap($file_barcode, $newfile_name, $pageno, $version) {
            if ($version > 1) {
                $this->db->query("update upload_map set status='Inactive' where pageno='$pageno' and file_barcode='$file_barcode'");
            }
            $query = $this->db->query("insert into upload_map (file_barcode,filename,pageno,version) values ('$file_barcode','$newfile_name','$pageno','$version')");
            return $query;
        }
        public function getPagerVersionMap($file_barcode, $pageno) {
            $query = $this->db->query("select * from upload_map where file_barcode='$file_barcode' and pageno='$pageno'");
            $rs = $query->result();
            return count($rs) + 1;
        }
        public function getEmployeeMAPcountExcel($file_barcode){
            $query = $this->db->query("SELECT file_barcode FROM upload_map WHERE file_barcode = '$file_barcode' AND status=''");
            $num = $query->num_rows();
            return $num;
        }
        public function deletemap($id) {
           
            $query = $this->db->query("select * from upload_map where map_id='$id'");
            $rs = $query->result();
            unlink("uploads/" . $rs[0]->file_barcode . "/map/" . $rs[0]->filename);
            $this->db->query("delete from upload_map where map_id='$id'");
            
            // $query = $this->db->query("select * from upload_map where map_id='$id'");
            // $rs = $query->result();
            // unlink("uploads/" . $this->User_model->getsingleemployee($rs[0]->emp_id)->employee_code . "/map/" . $rs[0]->filename);
            // $this->db->query("delete from upload_map where map_id='$id'");
        }
        public function getallmap($file_barcode) {
            $query = $this->db->query("select * from upload_map where status!='Inactive' and file_barcode='$file_barcode' order by pageno asc");
            $rs = $query->result();
            return $rs;
        }
        public function saveempmap($file_barcode, $newfile_name, $pageno, $version) {
        if ($version > 1) {
            $this->db->query("update upload_map set status='Inactive' where pageno='$pageno' and file_barcode='$file_barcode'");
        }
        $query = $this->db->query("insert into upload_map (file_barcode,filename,pageno,version) values ('$file_barcode','$newfile_name','$pageno','$version')");
        return $query;
    }
    
    public function getalluploadefileid($file_barcode) {
        $sbid = array();
        $query = $this->db->query("select pageno from upload_file where file_barcode='$file_barcode' AND status!='Inactive'");
        $rs = $query->result();
        foreach ($rs as $rss) {

            $sbid[] = $rss->pageno;
        }
        return implode(",", $sbid);
    }
    public function file_count() {
        $query = $this->db->query("select COUNT(*) AS mycount from file_tbl");
        $rs = $query->row();
        return $rs;
    }
    
    public function file_record_count() {
        $query = $this->db->query("select COUNT(DISTINCT file_barcode) AS mycount from upload_file where status!='Inactive'");
        $rs = $query->row();
        return $rs;
    }

}

?>