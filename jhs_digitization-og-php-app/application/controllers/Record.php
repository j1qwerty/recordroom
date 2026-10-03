<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Record extends CI_Controller {

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
    public function index(){
        $data['employee_list'] = $this->Record_model->getEmployeeList();
        $this->load->view("layout/header");
        $this->load->view("layout/leftmenu");
        $this->load->view("emp_search",$data);
        $this->load->view("layout/footer");
        
    }
    public function borrow_list($emp_id){
        //$emp_id = $_POST['emp_id'];
        
        if(!empty($emp_id) && $emp_id != '0'){
        $data['employeeDetail'] = $this->Record_model->getUserDetailByID($emp_id);
        $data['issue_detail'] = $this->Record_model->getIssueFileListByEmpID($emp_id);
        
        
        /*$data['file_list'] = $this->Record_model->getIssueFileListByEmpID($emp_id);
        
        $data['page'] = $page = ($this->uri->segment(4)) ? $this->uri->segment(4) : 0;
        
        $config["base_url"] = base_url() . "record/borrow_list/".$emp_id;

        $config["total_rows"] = $this->File_model->get_last_five_file_count();
        $config["per_page"] = 5;
        $config["uri_segment"] = 3;
        $this->pagination->initialize($config);

        $data["links"] = $this->pagination->create_links(); 
        $data['files'] = $this->File_model->get_last_five_files('all', $config["per_page"], $page);*/

        $data['files'] = $this->File_model->getAllFile();
     
        $this->load->view("layout/header");
        $this->load->view("layout/leftmenu");
        $this->load->view("booking_detail",$data);
        $this->load->view("layout/footer"); 
        }else{
            redirect('record');
        }
    }
    public function returnfile($issue_file_id){
        $data['issueDetail'] = $this->Record_model->getIssueFileByIssueID($issue_file_id);
        $data['employeeDetail'] = $this->Record_model->getUserDetailByID($data['issueDetail']->emp_id);
        $data['roomList'] = $this->Record_model->getRoomList();
        $this->load->view("layout/header");
        $this->load->view("layout/leftmenu");
        $this->load->view("return_file",$data);
        $this->load->view("layout/footer");
    }
    public function return_file(){
        $this->check_logg();
            $emp_id = $_POST['emp_id'];
            $depositor_code = $_POST['employee_code'];
            $shelf_barcode = $_POST['shelf_name_prev'];
            $issue_file_id = $_POST['issue_file_id'];
            $file_barcode = $_POST['file_barcode'];
                        
            $data = array(
                "depositor_code" => $depositor_code,
                "issue_file_id"  => $issue_file_id,
                "returned_date"  => date('Y-m-d'),
                "issue_status"   => 'Returned',
                "updated_date"   => date('Y-m-d')
            );

            $data_file = array(
                "shelf_barcode"  => $shelf_barcode,
                "file_status"    => 'Available',
                "updated_date"   => date('Y-m-d')
            );

            $this->Record_model->retunedFile($data,$issue_file_id);
            $this->Record_model->updateFile($data_file,$file_barcode);
            
            $this->session->set_flashdata("success", "File returned successfully.");
            redirect("record/borrow_list/".$emp_id);
    }
    
    public function getSection(){
        $room_id = $_POST['room_id'];
        $sectionList = $this->Record_model->getSectionList($room_id);
        $html = '<option value="">--Select Section--</option>'; 
        foreach($sectionList as $section){
            $html .= '<option value="'.$section->section_id.'">'.$section->section_name.'</option>'; 
        }
        print_r($html);
    }
    public function getAlmirah(){
        $section_id = $_POST['section_id'];
        $almirahList = $this->Record_model->getAlmirahList($section_id);
        $html = '<option value="">--Select Almirah--</option>'; 
        foreach($almirahList as $almirah){
            $html .= '<option value="'.$almirah->almirah_id.'">'.$almirah->almirah_name.'</option>'; 
        }
        print_r($html);
    }
    public function getShelf(){
        $almirah_id = $_POST['almirah_id'];
        $shelfList = $this->Record_model->getShelfList($almirah_id);
        $html = '<option value="">--Select Shelf--</option>'; 
        foreach($shelfList as $shelf){
            $html .= '<option value="'.$shelf->shelf_id.'">'.$shelf->shelf_name.'</option>'; 
        }
        print_r($html);
    }
    public function getShelfBarcode(){
        $shelf_id = $_POST['shelf_id'];
        $shelf_barcode = $this->Record_model->getShelfBarcode($shelf_id);
        echo $shelf_barcode->shelf_barcode;
    }
    
    public function issue_file(){
        $this->check_logg();
        $issue_date = empty($this->input->post('issue_date'))?date('Y-m-d'):$this->input->post('issue_date');
        $remark = ucfirst($this->input->post('remark'));
        $emp_id = $this->input->post('emp_id');
        $file_barcode = $this->input->post('file_barcode');
                
        $data = array(
            "emp_id" => $emp_id,
            "file_barcode"  => $file_barcode,
            "issue_date"  => $issue_date,
            "remark" => $remark,
            "issue_status"   => 'Issued',
            "created_date"   => date('Y-m-d')
        );

        $data_file = array(
            "file_status"    => 'Issued',
            "updated_date"   => date('Y-m-d')
        );

        $resp = $this->Record_model->insertIssueFile($data);
        $this->Record_model->updateFile($data_file,$file_barcode);

        if($resp){
            $this->session->set_flashdata("success", "File issued successfully.");
            redirect("record/borrow_list/".$emp_id);
        }else{
            $this->session->set_flashdata("success", "File not issued.");
            redirect("record");
        }
    }
    
    public function multipleFileIssue($emp_id){
        $this->check_logg();
        $file_id = $_POST['file_id'][0];
        //$emp_id = $_POST['emp_id'];
        $data['files'] = $this->Record_model->getSelectedFileDetail($file_id);
        $data['employeeDetail'] = $this->Record_model->getUserDetailByID($emp_id);

        $this->load->view("layout/header");
        $this->load->view("layout/leftmenu");
        $this->load->view("multiplefileissue",$data);
        $this->load->view("layout/footer"); 
    }
    public function savemultipleissuefile(){
        $emp_id = $this->input->post('emp_id');
        $remark = $this->input->post('remark');
        $issue_date = empty($this->input->post('IssueDateNew'))?date('Y-m-d'):$this->input->post('IssueDateNew');
        $file_id = $this->input->post('file_id');

        foreach($file_id as $id){
            $file = $this->Record_model->getFileBarcodeByID($id);
            $file_barcode = $file->file_barcode;
            
            $data = array(
                "emp_id" => $emp_id,
                "file_barcode"  => $file_barcode,
                "issue_date"  => $issue_date,
                "remark" => $remark,
                "issue_status"   => 'Issued',
                "created_date"   => date('Y-m-d')
            );

            $data_file = array(
                "file_status"    => 'Issued',
                "updated_date"   => date('Y-m-d')
            );

            $res = $this->Record_model->insertIssueFile($data);
            $this->Record_model->updateFile($data_file,$file_barcode);
        }
        $this->session->set_flashdata("success", "Multiple file issued successfully.");
        redirect("record/borrow_list/".$emp_id);
    }
    
    public function removeFile(){
        $file_old = $this->input->post('file_id_old');
        $file_remove = implode(',',$this->input->post('remove_file_id'));
        $file_remove = explode(',',$file_remove);

        $file_id = implode(',',array_diff($file_old,$file_remove));

        $emp_id = $this->input->post('emp_id');
        if(empty($file_id)){
            $this->session->set_flashdata("error", "No files selected for issue.");
            redirect("record/borrow_list/".$emp_id);
        }else{
        $data['files'] = $this->Record_model->getSelectedFileDetail($file_id);
        $data['employeeDetail'] = $this->Record_model->getUserDetailByID($emp_id);
        $this->load->view("layout/header");
        $this->load->view("layout/leftmenu");
        $this->load->view("multiplefileissue",$data);
        $this->load->view("layout/footer");}
    }
    
    public function issuefile(){
        $this->check_logg();
        
        $data["page"] = $page = ($this->uri->segment(3)) ? $this->uri->segment(3) : 0;
        
        $config["base_url"] = base_url() . "record/issuefile";
        $data["total_rows"] = $config["total_rows"] = $this->Record_model->get_last_five_issuefile_count();
        $config["per_page"] = 10;
        $config["uri_segment"] = 3;
        $this->pagination->initialize($config);

        $data["links"] = $this->pagination->create_links(); 

        $data['files'] = $this->Record_model->getissuefile('all', $config["per_page"], $page);
        
//        $data['files'] = $this->Record_model->getissuefile();
        $this->load->view("layout/header");
        $this->load->view("layout/leftmenu");
        $this->load->view("issuefile",$data);
        $this->load->view("layout/footer");
    }
    public function returnfilelist(){
        $this->check_logg();
        
        $data["page"] = $page = ($this->uri->segment(3)) ? $this->uri->segment(3) : 0;
        
        $config["base_url"] = base_url() . "record/returnfilelist";
        $data["total_rows"] = $config["total_rows"] = $this->Record_model->get_last_five_returnfile_count();
        $config["per_page"] = 10;
        $config["uri_segment"] = 3;
        $this->pagination->initialize($config);

        $data["links"] = $this->pagination->create_links(); 

        $data['files'] = $this->Record_model->getreturnfile('all', $config["per_page"], $page);
        $this->load->view("layout/header");
        $this->load->view("layout/leftmenu");
        $this->load->view("returnfilelist",$data);
        $this->load->view("layout/footer");
    }
}
    ?>