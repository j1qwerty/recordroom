<?php

class Store_model extends CI_Model {

    public function __construct() {
        parent::__construct();
    }
    
    public function insert($table,$data){
        $this->db->insert($table,$data);
        return $this->db->insert_id(); 
    }
    public function getRoomDetailByID($room_id){
        $query = $this->db->query('SELECT * FROM room_tbl WHERE room_id = "'.$room_id.'"');
        return $query->row();
    }
    
    public function updateroom($data,$room_id){
        $this->db->where('room_id', $room_id);
        $this->db->update('room_tbl', $data);
        return 1;
    }
    public function checkRoomExist($room_name){
        $query = $this->db->query("SELECT count(*) as total FROM room_tbl WHERE room_name = '".$room_name."'");
        return $query->row();
    }
    public function checkRoomSectionAvail($room_id){
        $query = $this->db->query("SELECT COUNT(*) as total FROM room_tbl WHERE room_tbl.room_id IN (SELECT section_tbl.room_id FROM section_tbl WHERE room_tbl.room_id = '$room_id')");
        return $query->row();
    }
    public function getAllRoomList(){
        $this->db->select('*');
        $this->db->from('room_tbl');
        $query = $this->db->get();
        $rs = $query->result();
        return $rs;
    }
    public function getAllSectionList(){
        $this->db->select('*');
        $this->db->join('room_tbl', 'section_tbl.room_id = room_tbl.room_id', 'left');
        $this->db->from('section_tbl');
        $query = $this->db->get();
        $rs = $query->result();
        return $rs;
    }
    public function checkSectionAlmirahAvail($section_id){
        $query = $this->db->query("SELECT COUNT(*) as total FROM section_tbl WHERE section_tbl.section_id IN (SELECT almirah_tbl.section_id FROM almirah_tbl WHERE almirah_tbl.section_id = '$section_id')");
        return $query->row();
    }
    public function checkSectionExist($section_name,$room_id){
        $query = $this->db->query("SELECT count(*) as total FROM section_tbl WHERE section_name = '".$section_name."' AND room_id = '$room_id'");
        return $query->row();
    }
    public function getSectionDetailByID($section_id){
        $query = $this->db->query('SELECT * FROM section_tbl WHERE section_id = "'.$section_id.'"');
        return $query->row();
    }
    public function updatesection($data,$section_id){
        $this->db->where('section_id', $section_id);
        $this->db->update('section_tbl', $data);
        return 1;
    }
    public function getAllAlmirahList(){
        $this->db->select('*');
        $this->db->join('section_tbl', 'almirah_tbl.section_id = section_tbl.section_id', 'left');
        $this->db->join('room_tbl', 'section_tbl.room_id = room_tbl.room_id', 'left');
        $this->db->from('almirah_tbl');
        $query = $this->db->get();
        $rs = $query->result();
        return $rs;
    }
    public function checkAlmirahShelfAvail($almirah_id){
        $query = $this->db->query("SELECT COUNT(*) as total FROM almirah_tbl WHERE almirah_tbl.almirah_id IN (SELECT shelf_tbl.almirah_id FROM shelf_tbl WHERE shelf_tbl.almirah_id = '$almirah_id')");
        return $query->row();
    }
    public function getSectionListByRoomID($room_id){
        $this->db->select('*');
        $this->db->where('room_id',$room_id);
        $this->db->where('section_status','1');
        $this->db->from('section_tbl');
        $query = $this->db->get();
        $rs = $query->result();
        return $rs;
    }
    public function checkAlmirahExist($almirah_name,$section_id,$room_id){
        $sql = "SELECT COUNT(*) as total FROM `almirah_tbl` "
                . "LEFT JOIN section_tbl ON almirah_tbl.section_id = section_tbl.section_id "
                . "LEFT JOIN room_tbl ON section_tbl.room_id = room_tbl.room_id "
                . "WHERE almirah_tbl.section_id = '$section_id' "
                . "AND almirah_tbl.almirah_name = '".$almirah_name."' "
                . "AND room_tbl.room_id = '$room_id'";
        $query = $this->db->query($sql);
        return $query->row();
    }
    public function getAlmirahDetailByID($almirah_id){
        $sql = "SELECT almirah_tbl.*,section_tbl.section_name,room_tbl.room_name,room_tbl.room_id FROM `almirah_tbl` 
                LEFT JOIN section_tbl ON almirah_tbl.section_id = section_tbl.section_id
                LEFT JOIN room_tbl ON section_tbl.room_id = room_tbl.room_id
                WHERE almirah_tbl.almirah_id = '$almirah_id'";
        $query = $this->db->query($sql);
        return $query->row();
    }
    public function updatealmirah($data,$almirah_id){
        $this->db->where('almirah_id', $almirah_id);
        $this->db->update('almirah_tbl', $data);
        return 1;
    }
    public function getAllShelfList(){
        $this->db->select('*');
        $this->db->join('almirah_tbl', 'shelf_tbl.almirah_id = almirah_tbl.almirah_id', 'left');
        $this->db->join('section_tbl', 'almirah_tbl.section_id = section_tbl.section_id', 'left');
        $this->db->join('room_tbl', 'section_tbl.room_id = room_tbl.room_id', 'left');
        $this->db->from('shelf_tbl');
        $query = $this->db->get();
        $rs = $query->result();
        return $rs;
    }
    public function checkShelfFileAvail($shelf_barcode){
        $sql = "SELECT COUNT(*) as total FROM shelf_tbl WHERE shelf_tbl.shelf_barcode IN (SELECT file_tbl.shelf_barcode FROM file_tbl WHERE file_tbl.shelf_barcode = '$shelf_barcode')";
        $query = $this->db->query($sql);
        return $query->row();
    }
    public function updateshelf($data,$shelf_id){
        $this->db->where('shelf_id', $shelf_id);
        $this->db->update('shelf_tbl', $data);
        return 1;
    }
    public function getAlmirahListBySectionID($section_id){
        $this->db->select('*');
        $this->db->where('section_id',$section_id);
        $this->db->where('almirah_status','1');
        $this->db->from('almirah_tbl');
        $query = $this->db->get();
        $rs = $query->result();
        return $rs;
    }
    public function checkShelfExist($almirah_id,$shelf_name,$shelf_barcode){
        $sql = "SELECT COUNT(*) as total FROM `shelf_tbl` WHERE almirah_id = '$almirah_id' AND (shelf_name = '".$shelf_name."' OR shelf_barcode = '".$shelf_barcode."')";
        $query = $this->db->query($sql);
        return $query->row();
    }
    public function getShelfDetailByID($shelf_id){
        $sql = "SELECT shelf_tbl.*,almirah_tbl.almirah_name,section_tbl.section_name,section_tbl.section_id,room_tbl.room_id,room_tbl.room_name FROM `shelf_tbl` 
                LEFT JOIN almirah_tbl ON shelf_tbl.almirah_id = almirah_tbl.almirah_id
                LEFT JOIN section_tbl ON almirah_tbl.section_id = section_tbl.section_id
                LEFT JOIN room_tbl ON section_tbl.room_id = room_tbl.room_id
                WHERE shelf_tbl.shelf_id = '$shelf_id'";
        $query = $this->db->query($sql);
        return $query->row();
    }
    
}
?>