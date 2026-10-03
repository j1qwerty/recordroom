<?php
class File_model extends CI_Model {

    public function __construct() {
        parent::__construct();
    }
    
    public function add_file($data, $file_barcode) {
        $this->db->insert('file_tbl', $data);
        if (!file_exists("uploads/" . $file_barcode)) {
            mkdir("uploads/" . $file_barcode, 0755);
            mkdir("uploads/" . $file_barcode . "/files", 0755);
            mkdir("uploads/" . $file_barcode . "/map", 0755);
        }

        $myfile = fopen("uploads/" . $file_barcode . "/files/index.html", "w") or die("Unable to open file!");
        $txt = "You don't have permission to view this file.";
        fwrite($myfile, $txt);

        fclose($myfile);

        $myfile = fopen("uploads/" . $file_barcode . "/map/index.html", "w") or die("Unable to open file!");
        $txt = "You don't have permission to view this file.";
        fwrite($myfile, $txt);

        fclose($myfile);
    }
    
    public function get_last_five_file_count($search_term='') {
        
        $sql = "SELECT * from file_tbl ";
        if($search_term!="all"){
            $sql.=" where file_barcode LIKE '%$search_term%' ";
        }
        $sql.="order by file_barcode ASC";
        $query = $this->db->query($sql);
        $rs = $query->num_rows();
        return $rs;
    }
    
    public function get_last_five_files($search_term='',$limit, $start) {

        $sql = "SELECT file_tbl.* from file_tbl WHERE status = 1 ";
        if($search_term!="all"){
            $sql.=" AND file_barcode LIKE '%$search_term%' ";
        }
        $sql.="ORDER BY file_barcode ASC LIMIT $start, $limit";

        $query = $this->db->query($sql);
        $rs = $query->result();
        return $rs;
    }
    
    public function search_file_count($search_data) {
        $search = $search_data['search'];
        $year = $search_data['year'];
//    	$sql = "select * from file_tbl where file_barcode LIKE '%$search%' ";
        $sql = "select * from file_tbl WHERE status = 1 AND (file_barcode ='".$search."' OR file_year = '$year')";
    	$query = $this->db->query($sql);
    	$rs = $query->num_rows();
    	return $rs;
    }
    
    public function search_file_data($search, $limit, $start) {
        $sql.= " SELECT file_tbl.* from file_tbl WHERE file_barcode LIKE '%$search%' OR file_name LIKE '%$search%'  LIMIT $start, $limit";
    	$query = $this->db->query($sql);
    	$rs = $query->result();
    	return $rs;
    }
    
    /*public function serach_file($search_data, $limit, $start){
        $search = $search_data['search'];
        $year = $search_data['year'];
        $sql = " SELECT file_tbl.* from file_tbl ";
        if(!empty($search) && !empty($year)){
            $sql.= " WHERE (file_barcode LIKE '%$search%' OR file_name LIKE '%$search%') AND file_year = '$year'";
        }else if(empty($search) && !empty($year)){
            $sql.= " WHERE file_year = '$year' ";
        }else if(!empty($search) && empty($year)){
            $sql.= " WHERE file_barcode = '".$search."' OR file_name = '".$search."' ";
        }else{
            $sql.= " WHERE 1=1 ";
        }
        
        $sql.= " LIMIT $start, $limit";
    	$query = $this->db->query($sql);
    	$rs = $query->result();
    	return $rs;
    }*/
    
    public function serach_file($search_data, $limit, $start){
//        echo '<pre>';print_r($search_data);
//        $year = $search_data['year'];
        
        if (isset($search_data['search'])) {
            $search = $search_data['search'];
        }else{ 
            $search = ''; 
        }
        
        if (isset($search_data['year'])) {
            $year = $search_data['year'];
        }else{ 
            $year = ''; 
        }
        
        if (isset($search_data['file_holder_name'])) {
            $file_holder_name = $search_data['file_holder_name'];
        }else{ 
            $file_holder_name = ''; 
        }
        
        if (isset($search_data['shelf_barcode'])) {
            $shelf_barcode = $search_data['shelf_barcode'];
        }else{ 
            $shelf_barcode = ''; 
        }
        
        if (isset($search_data['file_address'])) {
            $file_address = $search_data['file_address'];
        }else{ 
            $file_address = ''; 
        }
        
        if (isset($search_data['file_pincode'])) {
            $file_pincode = $search_data['file_pincode'];
        }else{ 
            $file_pincode = ''; 
        }
        
        if (isset($search_data['file_area'])) {
            $file_area = $search_data['file_area'];
        }else{ 
            $file_area = ''; 
        }
        
        if (isset($search_data['property_no'])) {
            $property_no = $search_data['property_no'];
        }else{ 
            $property_no = ''; 
        }
        
        if (isset($search_data['file_dealer'])) {
            $file_dealer = $search_data['file_dealer'];
        }else{ 
            $file_dealer = ''; 
        }
        
        $sql = " SELECT file_tbl.* from file_tbl WHERE status = 1 ";
        if (isset($search) && !empty($search)) {
            $sql .= " AND (file_barcode LIKE '%" . $search . "%' OR file_name LIKE '%" . $search . "%')";
        }
        
        if (isset($year) && !empty($year)) {
            $sql .= " AND file_year = '$year' ";
        }
        
        if (isset($file_holder_name) && !empty($file_holder_name)) {
            $sql .= " AND file_holder_name LIKE '%" . $file_holder_name . "%' ";
        }
        
        if (isset($shelf_barcode) && !empty($shelf_barcode)) {
            $sql .= " AND shelf_barcode LIKE '%" . $shelf_barcode . "%' ";
        }
        
        if (isset($file_address) && !empty($file_address)) {
            $sql .= " AND file_address LIKE '%" . $file_address . "%' ";
        }
        
        if (isset($file_pincode) && !empty($file_pincode)) {
            $sql .= " AND file_pincode LIKE '%" . $file_pincode . "%' ";
        }
        
        if (isset($file_area) && !empty($file_area)) {
            $sql .= " AND file_area LIKE '%" . $file_area . "%' ";
        }
        if (isset($file_area) && !empty($file_area)) {
            $sql .= " AND file_area LIKE '%" . $file_area . "%' ";
        }
        if (isset($property_no) && !empty($property_no)) {
            $sql .= " AND property_no LIKE '%" . $property_no . "%' ";
        }
        if (isset($file_dealer) && !empty($file_dealer)) {
            $sql .= " AND file_dealer LIKE '%" . $file_dealer . "%' ";
        }
        $sql.= " LIMIT $start, $limit";

    	$query = $this->db->query($sql);
    	$rs = $query->result();
    	return $rs;
    }
    
    public function get_file_year(){
        $sql = "SELECT DISTINCT(file_year) FROM `file_tbl` ORDER BY file_year DESC";
        $query = $this->db->query($sql);
    	$rs = $query->result();
    	return $rs;
    }
    
    public function getsinglefile($file_barcode) {
        $query = $this->db->query("select * from file_tbl where file_barcode ='$file_barcode'");
        $rs = $query->row();
        return $rs;
    }
    
    /* File upload function - 18-02-2021 */
    public function getFiledetail($file_barcode) {
        $query = $this->db->query("select * from upload_file where file_barcode ='$file_barcode' and status!='Inactive' order by pageno asc");
        $rs = $query->result();
        return $rs;
    }
    
    public function savefilecopy($empid, $newfile_name, $pageno, $version) {
        if ($version > 1) {
            $this->db->query("update upload_file set status='Inactive' where pageno='$pageno' and emp_id='$empid'");
        }
        $query = $this->db->query("insert into upload_file (emp_id, filename, pageno,version) values ('$empid','$newfile_name','$pageno','$version')");

        return $query;
    }
    
    public function UpdateFileByID($data, $file_barcode) {
        $this->db->where('file_barcode', $file_barcode);
        $results = $this->db->update('file_tbl', $data);
        return $results;
    }
    
    public function delete_file($file_barcode) {
        $query = $this->db->query("UPDATE file_tbl SET status = 0 WHERE file_barcode='$file_barcode'");
        return $query;
    }
    
    public function getAllFile(){
        $query = $this->db->query("SELECT * FROM file_tbl WHERE status = 1");
        $rs = $query->result();
        return $rs;
    }
    public function getLastInsertedShelfBarcode(){
        $query = $this->db->query("SELECT shelf_barcode FROM file_tbl ORDER BY file_tbl.file_id DESC LIMIT 0,1");
        $rs = $query->row();
        return $rs;
    }
    
    public function checkShelfBarcode($shelf_barcode){
        $query = $this->db->query("SELECT COUNT(*) as total FROM shelf_tbl WHERE shelf_tbl.shelf_barcode = '".$shelf_barcode."' AND shelf_status = '1'");
        $rs = $query->row();
        return $rs;
    }
    
    public function getAreaList(){
        $query = $this->db->query("SELECT * FROM master_area_tbl WHERE area_status = '1' ORDER BY area_name ASC");
        $rs = $query->result();
        return $rs;
    }
    public function getPincode($area_id){
        $query = $this->db->query("SELECT area_pincode FROM master_area_tbl WHERE area_id = '$area_id'");
        $rs = $query->row();
        return $rs;
    }
    public function getAreaName($area_id){
        $query = $this->db->query("SELECT area_name FROM master_area_tbl WHERE area_id = '$area_id'");
        $rs = $query->row();
        return $rs;
    }
}
?>