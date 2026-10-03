<?php

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

defined('BASEPATH') OR exit('No direct script access allowed');

class Store extends CI_Controller {

    public function __construct() {
        parent::__construct();
        header("Cache-Control: no-cache, must-revalidate");
        header("Cache-Control: post-check=0, pre-check=0", false);
        header("Pragma: no-cache");
        $this->load->helper('url');
        $this->load->database();
        $this->load->library('pagination');
    }
    
    public function check_logg() {
        if ($this->session->userdata("user_type") != 'Admin' && $this->session->userdata("user_type") != 'Emp_view' && $this->session->userdata("user_type") != 'Emp_edit') {
            redirect("user");
        }
    }
    /*Room start*/
    public function room(){
        $data['room_list'] = $this->Store_model->getAllRoomList();
        $this->load->view("layout/header");
        $this->load->view("layout/leftmenu");
        $this->load->view("roomList",$data);
        $this->load->view("layout/footer");
    }
    public function addroom(){
        $this->check_logg();
        $this->form_validation->set_rules('room_name', 'room name', 'required|trim|max_length[20]');
        if ($this->form_validation->run() != FALSE) {
            $room_name = $_POST['room_name'];
            
            $data = array(
                "room_name" => $room_name,
                "room_status" => 1,
                "created_date" => date('Y-m-d')
            );
            $response = $this->Store_model->insert('room_tbl',$data);
            if($response){
                $this->session->set_flashdata("success", "Room added successfully.");
                redirect("store/room");
            }
        } else {
            $this->session->set_flashdata("error", "Employee added successfully.");
            redirect("store/room");
        }
    }
    public function editroom($room_id){
        $this->check_logg();
        $data['room_detail'] = $this->Store_model->getRoomDetailByID($room_id);
        $data['room_list'] = $this->Store_model->getAllRoomList();
        $this->load->view("layout/header");
        $this->load->view("layout/leftmenu");
        $this->load->view("roomList",$data);
        $this->load->view("layout/footer");
    }
    
    public function updateroom(){
        $this->check_logg();
        $this->form_validation->set_rules('room_name', 'room name', 'required|trim|max_length[20]');
        if ($this->form_validation->run() != FALSE) {
            $room_name = $_POST['room_name'];
            $room_id = $_POST['room_id'];
            $res = $this->Store_model->checkRoomExist($room_name);
            if($res->total == 0){
                $data = array(
                    "room_name" => $room_name,
                    "room_status" => 1,
                    "updated_date" => date('Y-m-d')
                );
                $response = $this->Store_model->updateroom($data,$room_id);
                if($response){
                    $this->session->set_flashdata("success", "Room edited successfully.");
                    redirect("store/room");
                }
            }else{
                $this->session->set_flashdata("error", "Room name already exist.");
                redirect("store/room");
            }
        } else {
            $this->session->set_flashdata("error", "Please enter room name.");
            redirect("store/room");
        }
    }
    public function inactiveroom($room_id){
        $this->check_logg();
        $data = array(
            "room_status" => 0,
            "updated_date" => date('Y-m-d')
        );
        $response = $this->Store_model->updateroom($data,$room_id);
        if($response){
            $this->session->set_flashdata("success", "Room Inactive successfully.");
            redirect("store/room");
        }
    }
    public function activeroom($room_id){
        $this->check_logg();
        $data = array(
            "room_status" => 1,
            "updated_date" => date('Y-m-d')
        );
        $response = $this->Store_model->updateroom($data,$room_id);
        if($response){
            $this->session->set_flashdata("success", "Room active successfully.");
            redirect("store/room");
        }
    }
    /*Section start*/
    public function section(){
        $data['section_list'] = $this->Store_model->getAllSectionList();
        $data['room_list'] = $this->Record_model->getRoomList();
        $this->load->view("layout/header");
        $this->load->view("layout/leftmenu");
        $this->load->view("sectionList",$data);
        $this->load->view("layout/footer");
    }
    public function addsection(){
        $this->check_logg();
        $this->form_validation->set_rules('section_name', 'section name', 'required|trim|max_length[20]');
        if ($this->form_validation->run() != FALSE) {
            $section_name = $_POST['section_name'];
            $room_id = $_POST['room_id'];
            $res = $this->Store_model->checkSectionExist($section_name,$room_id);
            if($res->total == 0){
                $data = array(
                    "room_id" => $room_id,
                    "section_name" => $section_name,
                    "section_status" => 1,
                    "created_date" => date('Y-m-d')
                );
                $response = $this->Store_model->insert('section_tbl',$data);
                if($response){
                    $this->session->set_flashdata("success", "Section added successfully.");
                    redirect("store/section");
                }
            }else{
                $this->session->set_flashdata("error", "Section in this room already exist.");
                redirect("store/section");
            }
        } else {
            $this->session->set_flashdata("error", "Please enter section name.");
            redirect("store/section");
        }
    }
    public function editsection($section_id){
        $this->check_logg();
        $data['section_detail'] = $this->Store_model->getSectionDetailByID($section_id);
        $data['section_list'] = $this->Store_model->getAllSectionList();
        $data['room_list'] = $this->Store_model->getAllRoomList();
        $this->load->view("layout/header");
        $this->load->view("layout/leftmenu");
        $this->load->view("sectionList",$data);
        $this->load->view("layout/footer");
    }
    public function updatesection(){
        $this->check_logg();
        $this->form_validation->set_rules('section_name', 'section name', 'required|trim|max_length[20]');
        if ($this->form_validation->run() != FALSE) {
            $section_name = $_POST['section_name'];
            $room_id = $_POST['room_id'];
            $section_id = $_POST['section_id'];
            
            $res = $this->Store_model->checkSectionExist($section_name,$room_id);
            if($res->total == 0){
                $data = array(
                    "room_id" => $room_id,
                    "section_name" => $section_name,
                    "section_status" => 1,
                    "updated_date" => date('Y-m-d')
                );
                $response = $this->Store_model->updatesection($data,$section_id);
                if($response){
                    $this->session->set_flashdata("success", "Section edited successfully.");
                    redirect("store/section");
                }
            }else{
                $this->session->set_flashdata("error", "Section name already exist.");
                redirect("store/section");
            }
        } else {
            $this->session->set_flashdata("error", "Please enter section name.");
            redirect("store/section");
        }
    }
    public function inactivesection($section_id){
        $this->check_logg();
        $data = array(
            "section_status" => 0,
            "updated_date" => date('Y-m-d')
        );
        $response = $this->Store_model->updatesection($data,$section_id);
        if($response){
            $this->session->set_flashdata("success", "Section Inactive successfully.");
            redirect("store/section");
        }
    }
    public function activesection($section_id){
        $this->check_logg();
        $data = array(
            "section_status" => 1,
            "updated_date" => date('Y-m-d')
        );
        $response = $this->Store_model->updatesection($data,$section_id);
        if($response){
            $this->session->set_flashdata("success", "Section active successfully.");
            redirect("store/section");
        }
    }
    /*Almirah Start*/
    public function almirah(){
        $data['almirah_list'] = $this->Store_model->getAllAlmirahList();
        $data['section_list'] = $this->Store_model->getAllSectionList();
        $data['room_list'] = $this->Record_model->getRoomList();
        $this->load->view("layout/header");
        $this->load->view("layout/leftmenu");
        $this->load->view("almirahList",$data);
        $this->load->view("layout/footer");
    }
    public function sectionlist(){
        $room_id = $_POST['room_id'];
        $section_list = $this->Store_model->getSectionListByRoomID($room_id);
        $html = '';
        $html = '<option value="">--Select Section--</option>';
        foreach($section_list as $list){
            $html .= '<option value='.$list->section_id.'>'.$list->section_name.'</option>';
        }
        echo $html;
    }
    public function addalmirah(){
        $this->check_logg();
        $this->form_validation->set_rules('almirah_name', 'almirah name', 'required|trim|max_length[20]');
        $this->form_validation->set_rules('section_id', 'section name', 'required');
        $this->form_validation->set_rules('room_id', 'room name', 'required');
        if ($this->form_validation->run() != FALSE) {
            $almirah_name = $_POST['almirah_name'];
            $room_id = $_POST['room_id'];
            $section_id = $_POST['section_id'];
            
            $res = $this->Store_model->checkAlmirahExist($almirah_name,$section_id,$room_id);
            if($res->total == 0){
                $data = array(
                    "section_id" => $section_id,
                    "almirah_name" => $almirah_name,
                    "almirah_status" => 1,
                    "created_date" => date('Y-m-d')
                );
                $response = $this->Store_model->insert('almirah_tbl',$data);
                if($response){
                    $this->session->set_flashdata("success", "Almirah added successfully.");
                    redirect("store/almirah");
                }
            }else{
                $this->session->set_flashdata("error", "Almirah in this section already exist.");
                redirect("store/almirah");
            }
        } else {
            $this->session->set_flashdata("error", "Please enter almirah name.");
            redirect("store/almirah");
        }
    }
    public function editalmirah($almirah_id){
        $this->check_logg();
        $data['almirah_detail'] = $this->Store_model->getAlmirahDetailByID($almirah_id);
        $room_id = $data['almirah_detail']->room_id;
        $data['almirah_list'] = $this->Store_model->getAllAlmirahList();
        $data['section_list'] = $this->Store_model->getSectionListByRoomID($room_id);
        $data['room_list'] = $this->Record_model->getRoomList();
        $this->load->view("layout/header");
        $this->load->view("layout/leftmenu");
        $this->load->view("almirahList",$data);
        $this->load->view("layout/footer");
    }
    public function updatealmirah(){
        $this->check_logg();
        $this->form_validation->set_rules('almirah_name', 'almirah name', 'required|trim|max_length[20]');
        $this->form_validation->set_rules('section_id', 'section name', 'required');
        $this->form_validation->set_rules('room_id', 'room name', 'required');
        if ($this->form_validation->run() != FALSE) {
            $almirah_name = $_POST['almirah_name'];
            $room_id = $_POST['room_id'];
            $section_id = $_POST['section_id'];
            $almirah_id = $_POST['almirah_id'];
            
            $res = $this->Store_model->checkAlmirahExist($almirah_name,$section_id,$room_id);
            if($res->total == 0){
                $data = array(
                    "section_id" => $section_id,
                    "almirah_name" => $almirah_name,
                    "almirah_status" => 1,
                    "updated_date" => date('Y-m-d')
                );
                $response = $this->Store_model->updatealmirah($data,$almirah_id);
                if($response){
                    $this->session->set_flashdata("success", "Almirah edited successfully.");
                    redirect("store/almirah");
                }
            }else{
                $this->session->set_flashdata("error", "Almirah name already exist.");
                redirect("store/almirah");
            }
        } else {
            $this->session->set_flashdata("error", "Please enter almirah name.");
            redirect("store/almirah");
        }
    }
    public function inactivealmirah($almirah_id){
        $this->check_logg();
        $data = array(
            "almirah_status" => 0,
            "updated_date" => date('Y-m-d')
        );
        $response = $this->Store_model->updatealmirah($data,$almirah_id);
        if($response){
            $this->session->set_flashdata("success", "Almirah Inactive successfully.");
            redirect("store/almirah");
        }
    }
    public function activealmirah($almirah_id){
        $this->check_logg();
        $data = array(
            "almirah_status" => 1,
            "updated_date" => date('Y-m-d')
        );
        $response = $this->Store_model->updatealmirah($data,$almirah_id);
        if($response){
            $this->session->set_flashdata("success", "Almirah active successfully.");
            redirect("store/almirah");
        }
    }
    /*Shelf Start */
    public function shelf(){
        $data['shelf_list'] = $this->Store_model->getAllShelfList();
        $data['room_list'] = $this->Record_model->getRoomList();
        $this->load->view("layout/header");
        $this->load->view("layout/leftmenu");
        $this->load->view("shelfList",$data);
        $this->load->view("layout/footer");
    }
    public function inactiveshelf($shelf_id){
        $this->check_logg();
        $data = array(
            "shelf_status" => 0,
            "updated_date" => date('Y-m-d')
        );
        $response = $this->Store_model->updateshelf($data,$shelf_id);
        if($response){
            $this->session->set_flashdata("success", "Shelf Inactive successfully.");
            redirect("store/shelf");
        }
    }
    public function activeshelf($shelf_id){
        $this->check_logg();
        $data = array(
            "shelf_status" => 1,
            "updated_date" => date('Y-m-d')
        );
        $response = $this->Store_model->updateshelf($data,$shelf_id);
        if($response){
            $this->session->set_flashdata("success", "Shelf active successfully.");
            redirect("store/shelf");
        }
    }
    public function almirahlist(){
        $section_id = $_POST['section_id'];
        $almirah_list = $this->Store_model->getAlmirahListBySectionID($section_id);
        $html = '';
        $html = '<option value="">--Select Almirah--</option>';
        foreach($almirah_list as $list){
            $html .= '<option value='.$list->almirah_id.'>'.$list->almirah_name.'</option>';
        }
        echo $html;
    }
    public function addshelf(){
        $this->check_logg();
        $this->form_validation->set_rules('shelf_name', 'shelf name', 'required|trim|max_length[20]');
        $this->form_validation->set_rules('shelf_barcode', 'shelf barcode', 'required|trim|max_length[20]');
        $this->form_validation->set_rules('almirah_id', 'almirah name', 'required');
        $this->form_validation->set_rules('section_id', 'section name', 'required');
        $this->form_validation->set_rules('room_id', 'room name', 'required');
        if ($this->form_validation->run() != FALSE) {
            $shelf_name = $_POST['shelf_name'];
            $shelf_barcode = $_POST['shelf_barcode'];
            $almirah_id = $_POST['almirah_id'];
            
            $res = $this->Store_model->checkShelfExist($almirah_id,$shelf_name,$shelf_barcode);
            if($res->total == 0){
                $data = array(
                    "shelf_barcode" => $shelf_barcode,
                    "shelf_name" => $shelf_name,
                    "almirah_id" => $almirah_id,
                    "shelf_status" => 1,
                    "created_date" => date('Y-m-d')
                );
                $response = $this->Store_model->insert('shelf_tbl',$data);
                if($response){
                    $this->session->set_flashdata("success", "Shelf added successfully.");
                    redirect("store/shelf");
                }
            }else{
                $this->session->set_flashdata("error", "Shelf in this almirah already exist.");
                redirect("store/shelf");
            }
        } else {
            $this->session->set_flashdata("error", "Please enter shelf name.");
            redirect("store/shelf");
        }
    }
    public function editshelf($shelf_id){
        $this->check_logg();
        $data['shelf_detail'] = $this->Store_model->getShelfDetailByID($shelf_id);
        $room_id = $data['shelf_detail']->room_id;
        $section_id = $data['shelf_detail']->section_id;
        $data['almirah_list'] = $this->Store_model->getAlmirahListBySectionID($section_id);
        $data['section_list'] = $this->Store_model->getSectionListByRoomID($room_id);
        $data['room_list'] = $this->Record_model->getRoomList();
        $data['shelf_list'] = $this->Store_model->getAllShelfList();
        $this->load->view("layout/header");
        $this->load->view("layout/leftmenu");
        $this->load->view("shelfList",$data);
        $this->load->view("layout/footer");
    }
    public function updateshelf(){
        $this->check_logg();
        $this->form_validation->set_rules('shelf_barcode', 'shelf barcode', 'required|trim|max_length[20]');
        $this->form_validation->set_rules('shelf_name', 'shelf name', 'required|trim|max_length[20]');
        $this->form_validation->set_rules('almirah_id', 'almirah name', 'required');
        $this->form_validation->set_rules('section_id', 'section name', 'required');
        $this->form_validation->set_rules('room_id', 'room name', 'required');
        if ($this->form_validation->run() != FALSE) {
            $shelf_barcode = $_POST['shelf_barcode'];
            $shelf_name = $_POST['shelf_name'];
            $room_id = $_POST['room_id'];
            $section_id = $_POST['section_id'];
            $almirah_id = $_POST['almirah_id'];
            $shelf_id = $_POST['shelf_id'];
            
            $res = $this->Store_model->checkShelfExist($almirah_id,$shelf_name,$shelf_barcode);

            if($res->total == 0 || $res->total == 1){
                $data = array(
                    "almirah_id" => $almirah_id,
                    "shelf_name" => $shelf_name,
                    "shelf_barcode" => $shelf_barcode,
                    "shelf_status" => 1,
                    "updated_date" => date('Y-m-d')
                );
                $response = $this->Store_model->updateshelf($data,$shelf_id);
                if($response){
                    $this->session->set_flashdata("success", "Shelf edited successfully.");
                    redirect("store/shelf");
                }
            }else{
                $this->session->set_flashdata("error", "Shelf name or barcode already exist.");
                redirect("store/shelf");
            }
        } else {
            $this->session->set_flashdata("error", "Please enter shelf name or barcode.");
            redirect("store/shelf");
        }
    }
}
    ?>