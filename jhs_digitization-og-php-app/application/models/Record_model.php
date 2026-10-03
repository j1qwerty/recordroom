<?php

class Record_model extends CI_Model {

    public function __construct() {
        parent::__construct();
    }
    
    public function getEmployeeList($search_term='') {
        
        $sql = "SELECT * from drm_employee ";
        if($search_term){
            $sql.=" where employee_code LIKE '%$search_term%' ";
        }
        $sql.="order by employee_name ASC";
        $query = $this->db->query($sql);
        $rs = $query->result();
        return $rs;
    }
    public function getUserDetailByID($emp_id){
	$query = $this->db->query("SELECT drm_employee.*,emp_department.name as department_name,emp_designation.name as designation_name 
                                    FROM `drm_employee`
                                    LEFT JOIN emp_department ON drm_employee.emp_department = emp_department.id
                                    LEFT JOIN emp_designation ON drm_employee.emp_designation = emp_designation.id
                                    WHERE drm_employee.emp_id =  '".$emp_id."'");
        $rs = $query->row();
        return $rs;
    }
    public function getIssueFileListByEmpID($emp_id){
        $query = $this->db->query("SELECT issue_file_tbl.*,file_tbl.file_name,file_tbl.shelf_barcode FROM `issue_file_tbl` 
                                    LEFT JOIN file_tbl ON issue_file_tbl.file_barcode = file_tbl.file_barcode
                                    WHERE emp_id = '".$emp_id."' AND issue_status != 'returned'");
        $rs = $query->result();
        return $rs;
    }
    public function getIssueFileByIssueID($issue_file_id){
        $query = $this->db->query("SELECT issue_file_tbl.*,file_tbl.* FROM `issue_file_tbl` 
                                    LEFT JOIN file_tbl ON issue_file_tbl.file_barcode = file_tbl.file_barcode
                                    WHERE issue_file_id = '".$issue_file_id."'");
        $rs = $query->row();
        return $rs;
    }
    public function retunedFile($data,$issue_file_id){
        $this->db->where('issue_file_id', $issue_file_id);
        $this->db->update('issue_file_tbl', $data);
    }
    public function updateFile($data,$file_barcode){
        $this->db->where('file_barcode', $file_barcode);
        $this->db->update('file_tbl', $data);
    }
    public function getRoomList(){
        $this->db->select('*');
        $this->db->where('room_status','1');
        $this->db->from('room_tbl');
        $query = $this->db->get();
        $rs = $query->result();
        return $rs;
    }
    public function getSectionList($room_id){
        $this->db->select('*');
        $this->db->where('section_status','1');
        $this->db->where('room_id',$room_id);
        $this->db->from('section_tbl');
        $query = $this->db->get();
        $rs = $query->result();
        return $rs;
    }
    public function getAlmirahList($section_id){
        $this->db->select('*');
        $this->db->where('almirah_status','1');
        $this->db->where('section_id',$section_id);
        $this->db->from('almirah_tbl');
        $query = $this->db->get();
        $rs = $query->result();
        return $rs;
    }
    public function getShelfList($almirah_id){
        $this->db->select('*');
        $this->db->where('shelf_status','1');
        $this->db->where('almirah_id',$almirah_id);
        $this->db->from('shelf_tbl');
        $query = $this->db->get();
        $rs = $query->result();
        return $rs;
    }
    public function getShelfBarcode($shelf_id){
        $this->db->select('shelf_barcode');
        $this->db->where('shelf_status','1');
        $this->db->where('shelf_id',$shelf_id);
        $this->db->from('shelf_tbl');
        $query = $this->db->get();
        $rs = $query->row();
        return $rs;
    }
   
    public function getFileLocation($shelf_barcode){
        $query = $this->db->query("SELECT shelf_tbl.shelf_barcode, shelf_tbl.shelf_name,almirah_tbl.almirah_barcode,almirah_tbl.almirah_name,section_tbl.section_name,room_tbl.room_name 
                FROM shelf_tbl
                LEFT JOIN almirah_tbl ON shelf_tbl.almirah_id = almirah_tbl.almirah_id
                LEFT JOIN section_tbl ON almirah_tbl.section_id = section_tbl.section_id
                LEFT JOIN room_tbl ON section_tbl.room_id = room_tbl.room_id
                WHERE shelf_tbl.shelf_barcode = '".$shelf_barcode."'");
        $rs = $query->row();
        return $rs;
    }
    
    public function getIssuedEmp($file_barcode){
        $query = $this->db->query("SELECT drm_employee.*,emp_department.name as department_name,emp_designation.name as designation_name
            FROM drm_employee 
            LEFT JOIN emp_department ON drm_employee.emp_department = emp_department.id
            LEFT JOIN emp_designation ON drm_employee.emp_designation = emp_designation.id
            WHERE emp_id IN (SELECT emp_id FROM issue_file_tbl WHERE file_barcode = '".$file_barcode."' AND issue_status = 'issued')");
        $rs = $query->row();
        return $rs;
    }
    
    public function getIssueDetail($file_barcode){
        $query = $this->db->query("SELECT issue_file_tbl.* FROM issue_file_tbl WHERE  file_barcode = '".$file_barcode."' AND issue_status = 'issued' ");
        $rs = $query->row();
        return $rs;
    }
    
    public function insertIssueFile($data){
        $this->db->insert('issue_file_tbl',$data);
        return 1;
    }
    
    public function getSelectedFileDetail($file_id){
        $query = $this->db->query("SELECT * FROM file_tbl WHERE file_id IN ($file_id)");
        $rs = $query->result();
        return $rs;
    }
    public function getFileBarcodeByID($id){
        $query = $this->db->query("SELECT file_barcode FROM file_tbl WHERE file_id = '$id'");
        $rs = $query->row();
        return $rs;
    }
    public function getissuefile($search_term='',$limit, $start){
        
        $sql = "SELECT issue_file_tbl.*,drm_employee.employee_code,drm_employee.employee_name,emp_department.name as department_name,emp_designation.name as designation_name,file_tbl.file_name,file_tbl.file_year,file_tbl.file_holder_name FROM issue_file_tbl 
            LEFT JOIN drm_employee ON issue_file_tbl.emp_id = drm_employee.emp_id
            LEFT JOIN file_tbl ON issue_file_tbl.file_barcode = file_tbl.file_barcode
            LEFT JOIN emp_department ON drm_employee.emp_department = emp_department.id
            LEFT JOIN emp_designation ON drm_employee.emp_designation = emp_designation.id
            WHERE issue_file_tbl.issue_status = 'Issued'";
        if($search_term!="all"){
            $sql.=" AND file_tbl.file_name LIKE '%$search_term%' or file_tbl.file_barcode LIKE '%$search_term%' ";
        }
        $sql.=" ORDER BY file_tbl.file_barcode DESC LIMIT $start, $limit";

        $query = $this->db->query($sql);
        $rs = $query->result();
        return $rs;
    }
    public function getreturnfile($search_term='',$limit, $start){
       
        $sql = "SELECT issue_file_tbl.*,file_tbl.file_name,file_tbl.shelf_barcode,
            file_tbl.file_year,file_tbl.file_holder_name,room_tbl.room_name,section_tbl.section_name,
            almirah_tbl.almirah_name,shelf_tbl.shelf_name 
            FROM issue_file_tbl 
            LEFT JOIN drm_employee ON issue_file_tbl.emp_id = drm_employee.emp_id
            LEFT JOIN file_tbl ON issue_file_tbl.file_barcode = file_tbl.file_barcode
            LEFT JOIN shelf_tbl ON file_tbl.shelf_barcode = shelf_tbl.shelf_barcode
            LEFT JOIN almirah_tbl ON shelf_tbl.almirah_id = almirah_tbl.almirah_id
            LEFT JOIN section_tbl ON almirah_tbl.section_id = section_tbl.section_id
            LEFT JOIN room_tbl ON section_tbl.room_id = room_tbl.room_id
            WHERE issue_file_tbl.issue_status = 'Returned'";
        if($search_term!="all"){
            $sql.=" AND file_tbl.file_name LIKE '%$search_term%' or file_tbl.file_barcode LIKE '%$search_term%' ";
        }
        $sql.="order by file_tbl.file_barcode DESC LIMIT $start, $limit";
        $query = $this->db->query($sql);
        $rs = $query->result();
        return $rs;
    }
    
    public function get_last_five_returnfile_count($search_term = '') {
        
        $sql = "SELECT issue_file_tbl.* FROM issue_file_tbl "
                . "LEFT JOIN file_tbl ON issue_file_tbl.file_barcode = file_tbl.file_barcode "
                . "WHERE issue_file_tbl.issue_status = 'Returned' ";
        if($search_term != "all" && $search_term != ''){
            $sql.=" AND file_tbl.file_name LIKE '%$search_term%' or file_tbl.file_barcode LIKE '%$search_term%' ";
        }
        $sql.="ORDER BY issue_file_tbl.returned_date DESC";
        $query = $this->db->query($sql);
        $rs = $query->num_rows();
        return $rs;
    }
    public function get_last_five_issuefile_count($search_term = '') {
        $sql = "SELECT issue_file_tbl.* FROM issue_file_tbl "
                . "LEFT JOIN file_tbl ON issue_file_tbl.file_barcode = file_tbl.file_barcode "
                . "WHERE issue_file_tbl.issue_status = 'Issued' ";
        if($search_term != "all" && $search_term != ''){
            $sql.=" AND file_tbl.file_name LIKE '%$search_term%' or file_tbl.file_barcode LIKE '%$search_term%' ";
        }
        $sql.="ORDER BY issue_file_tbl.issue_date DESC";
        $query = $this->db->query($sql);
        $rs = $query->num_rows();
        return $rs;
    }
}
?>