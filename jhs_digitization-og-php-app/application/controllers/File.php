<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class File extends CI_Controller {

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
    public function checkfilebarcode() {
        $file_barcode = $_POST['file_barcode'];
        $query = $this->db->query("select * from file_tbl where file_barcode='$file_barcode'");
        $num = $query->num_rows();
        echo $num;
    }
    public function file() {
        $this->check_logg();
        $data['shelf_barcode_prev'] = $this->File_model->getLastInsertedShelfBarcode();
        $data['area_list'] = $this->File_model->getAreaList();
        $this->load->view("layout/header");
        $this->load->view("layout/leftmenu");
        $this->load->view("file",$data);
        $this->load->view("layout/footer");
    }
    public function make_file() {
        $this->check_logg();
        $this->form_validation->set_rules('file_barcode', 'File Barcode', 'required');
        $this->form_validation->set_rules('file_name', 'File Name', 'required');
        $this->form_validation->set_rules('file_holder_name', 'Holder Name', 'required');
        $this->form_validation->set_rules('shelf_barcode', 'Shelf Barcode', 'required');
        $this->form_validation->set_rules('file_type', 'Type', 'required');
        $this->form_validation->set_rules('file_year', 'Year', 'required');
        $this->form_validation->set_rules('file_address', 'Address', 'required|trim|min_length[10]|max_length[200]');
        $this->form_validation->set_rules('file_pincode', 'Pincode', 'required|trim|min_length[1]|max_length[6]');
        $this->form_validation->set_rules('file_area', 'Area', 'required');
        //$this->form_validation->set_rules('property_no', 'Property No', 'required');
        $this->form_validation->set_rules('property_area', 'Property Area', 'required');
        //$this->form_validation->set_rules('file_dealer', 'Dealer', 'required');

        if ($this->form_validation->run() != FALSE) {
            $file_barcode = $_POST['file_barcode'];
            $file_name = $_POST['file_name'];
            $file_holder_name = $_POST['file_holder_name'];
            $shelf_barcode = $_POST['shelf_barcode'];
            
            $file_type = $_POST['file_type'];
            $file_year = $_POST['file_year'];
            $file_address = $_POST['file_address'];
            $file_pincode = $_POST['file_pincode'];
            $file_area = $_POST['file_area'];
            $property_no = $_POST['property_no'];
            $property_area = $_POST['property_area'];
            $file_dealer = $_POST['file_dealer'];
            
            $check_shelfBarcode = $this->File_model->checkShelfBarcode($shelf_barcode);
            
            if($check_shelfBarcode->total == 0){
                $this->session->set_flashdata("error", "Shelf barcode is not exist or inactive.");
                redirect("file/file");
            }else{
            $data = array(
                "file_barcode" => $file_barcode,
                "file_name" => $file_name,
                "file_holder_name" => $file_holder_name,
                "shelf_barcode" => $shelf_barcode,
                "file_type" => $file_type,
                "file_year" => $file_year,
                "file_address" => $file_address,
                "file_pincode" => $file_pincode,
                "file_area" => $file_area,
                "property_no" => $property_no,
                "property_area" => $property_area,
                "file_dealer" => $file_dealer,
                "file_status" => 'Available'
            );
            $query = $this->db->query("select * from file_tbl where file_barcode='$file_barcode'");
            $num = $query->num_rows();
            if ($num < 1) {

                $this->File_model->add_file($data, $file_barcode);

                $this->session->set_flashdata("success", "File added successfully.");
                redirect("user/uploadfile/".$file_barcode);
//                redirect("file/file");
            } else {
                $this->session->set_flashdata("error", "Duplicate file barcode not allowed.");
                redirect("file/file");
            }
            }
        } else {
            $this->check_logg();
            $data['shelf_barcode_prev'] = $this->File_model->getLastInsertedShelfBarcode();
            $data['area_list'] = $this->File_model->getAreaList();
            $this->load->view("layout/header");
            $this->load->view("layout/leftmenu");
            $this->load->view("file",$data);
            $this->load->view("layout/footer");
        }
    }
    
    public function search_file($search_result='') {

    $this->check_logg();
    $this->load->view("layout/header");
    $this->load->view("layout/leftmenu");

    if (isset($_POST['search'])) {
        $this->form_validation->set_rules('search', 'File barcode', 'min_length[3]');
        if ($this->form_validation->run() != FALSE) {
            $search = $this->input->post('search');
            $year = $this->input->post('year');
            if ($search == '' && $year == '') {
                $this->session->set_userdata('blank', 'Search');
                redirect('file/file_listing');
            }

            $search_data = array(
                'search'=>$search,
                'year'=> $year
            );
            
            $config["base_url"] = base_url() . "file/search_file/".$search;
            $data["total_rows"] = $config["total_rows"] = $this->File_model->search_file_count($search_data);
            $config["per_page"] = 10	;
            $config["uri_segment"] = 3;

            $this->pagination->initialize($config);
            $data["page"] = $page = ($this->uri->segment(3)) ? $this->uri->segment(3) : 0;

            $data["links"] = $this->pagination->create_links();		

            $this->pagination->initialize($config);

//            $data['employees'] = $this->File_model->search_file_data($search, $config["per_page"], $page);
            $data['employees'] = $this->File_model->serach_file($search_data, $config["per_page"], $page);

            $data['search'] = array('search' => $search);

            $this->load->view("search_file", $data);
        } else {
            $this->check_logg();
            $data['search'] = array('search' => '');
            $this->load->view("search_file", $data);
        }
    } elseif (!empty($this->uri->segment('4'))) {

        $config["base_url"] = base_url() . "file/search_file/" . $search_result;
            $data["total_rows"] = $config["total_rows"] = $this->File_model->search_file_count(urldecode($search_result));
            $config["per_page"] = 10;
            $config["uri_segment"] = 4;

            $this->pagination->initialize($config);

            $data["page"] = $page = ($this->uri->segment(4)) ? $this->uri->segment(4) : 0;

            $data["links"] = $this->pagination->create_links();

            $this->pagination->initialize($config);

            $data['employees'] = $this->User_model->search_employee_data(urldecode($search_result), $config["per_page"], $page);

            $data['search'] = array('search' => urldecode($search_result));

            $this->load->view("search_file", $data);
        } else {
            $search_result = $this->uri->segment('3');
            // $this->load->view("search_employee");
            if ($search_result == '') {
                $this->session->set_userdata('blank', 'Search');
                redirect('file/file_listing');
            }
            $config["base_url"] = base_url() . "file/search_file/" . $search_result;
            $data["total_rows"] = $config["total_rows"] = $this->File_model->search_file_count($search_result);
            $config["per_page"] = 10;
            $config["uri_segment"] = 4;

            $this->pagination->initialize($config);
            $data["page"] = $page = ($this->uri->segment(4)) ? $this->uri->segment(4) : 0;

            $data["links"] = $this->pagination->create_links();

            $this->pagination->initialize($config);

            $data['file'] = $this->File_model->search_file_data($search_result, $config["per_page"], $page);

            $data['search'] = array('search' => $search_result);

            $this->load->view("search_file", $data);
        }
        $this->load->view("layout/footer");
    }
    
    public function search_dashboard_file(){
        $search = $this->input->post('search');
        $year = $this->input->post('year');
        $file_holder_name = $this->input->post('file_holder_name');
        $shelf_barcode = $this->input->post('shelf_barcode');
        $file_address = $this->input->post('file_address');
        $file_pincode = $this->input->post('file_pincode');
        $file_area = $this->input->post('file_area');
        $property_no = $this->input->post('property_no');
        $file_dealer = $this->input->post('file_dealer');

        $search_data = array(
            'search'=>$search,
            'year'=> $year,
            'file_holder_name' => $file_holder_name,
            'shelf_barcode' => $shelf_barcode,
            'file_address' => $file_address,
            'file_pincode' => $file_pincode,
            'file_area' => $file_area,
            'property_no' => $property_no, 
            'file_dealer' => $file_dealer
        );
    

        if(!empty($file_area)){
        $area = $this->File_model->getAreaName($file_area);
        $area = $area->area_name;
		
			$searchDisplay = array(
				'search'=>$search,
				'year'=> $year,
				'file_holder_name' => $file_holder_name,
				'shelf_barcode' => $shelf_barcode,
				'file_address' => $file_address,
				'file_pincode' => $file_pincode,
				'file_area' => $area,
				'property_no' => $property_no, 
				'file_dealer' => $file_dealer
			);
		}else{
			$searchDisplay = array(
				'search'=>$search,
				'year'=> $year,
				'file_holder_name' => $file_holder_name,
				'shelf_barcode' => $shelf_barcode,
				'file_address' => $file_address,
				'file_pincode' => $file_pincode,
				'property_no' => $property_no, 
				'file_dealer' => $file_dealer
			);

		}

        $data['search_data'] = $searchDisplay;

        $config["base_url"] = base_url() . "user/dashboard";
        $data["total_rows"] = $config["total_rows"] = $this->File_model->search_file_count($search_data);
        $config["per_page"] = 10	;
        $config["uri_segment"] = 3;

        $this->pagination->initialize($config);
        $data["page"] = $page = ($this->uri->segment(3)) ? $this->uri->segment(3) : 0;

        $data["links"] = $this->pagination->create_links();		

        $this->pagination->initialize($config);

        $data['employees'] = $this->File_model->serach_file($search_data, $config["per_page"], $page);
        $data['year_list'] = $this->File_model->get_file_year();
        $data['area_list'] = $this->File_model->getAreaList();

        $this->load->view("layout/header");
        $this->load->view("layout/leftmenu");
        $this->load->view("dashboard", $data);
        $this->load->view("layout/footer");
    }
    
    public function file_listing() {
        
        if (isset($_POST['search'])) {
                $search = $this->input->post('search');
                $year = $this->input->post('year');
                $file_holder_name = $this->input->post('file_holder_name');
                $shelf_barcode = $this->input->post('shelf_barcode');
                $file_address = $this->input->post('file_address');
                $file_pincode = $this->input->post('file_pincode');
                $file_area = $this->input->post('file_area');
                $property_no = $this->input->post('property_no');
                $file_dealer = $this->input->post('file_dealer');
                
                $search_data = array(
                    'search'=>$search,
                    'year'=> $year,
                    'file_holder_name' => $file_holder_name,
                    'shelf_barcode' => $shelf_barcode,
                    'file_address' => $file_address,
                    'file_pincode' => $file_pincode,
                    'file_area' => $file_area,
                    'property_no' => $property_no, 
                    'file_dealer' => $file_dealer
                );
                
                if(!empty($file_area)){
                $area = $this->File_model->getAreaName($file_area);
                $area = $area->area_name;
        		
        			$searchDisplay = array(
        				'search'=>$search,
        				'year'=> $year,
        				'file_holder_name' => $file_holder_name,
        				'shelf_barcode' => $shelf_barcode,
        				'file_address' => $file_address,
        				'file_pincode' => $file_pincode,
        				'file_area' => $area,
        				'property_no' => $property_no, 
        				'file_dealer' => $file_dealer
        			);
        		}else{
        			$searchDisplay = array(
        				'search'=>$search,
        				'year'=> $year,
        				'file_holder_name' => $file_holder_name,
        				'shelf_barcode' => $shelf_barcode,
        				'file_address' => $file_address,
        				'file_pincode' => $file_pincode,
        				'property_no' => $property_no, 
        				'file_dealer' => $file_dealer
        			);
        
        		}
                
                $data['search_data'] = $searchDisplay;
                
                $config["base_url"] = base_url() . "file/search_file/".$search;
    //            $data["total_rows"] = $config["total_rows"] = $this->File_model->search_file_count($search);
                $data["total_rows"] = $config["total_rows"] = $this->File_model->search_file_count($search_data);
                $config["per_page"] = 10	;
                $config["uri_segment"] = 3;

                $this->pagination->initialize($config);
                $data["page"] = $page = ($this->uri->segment(3)) ? $this->uri->segment(3) : 0;

                $data["links"] = $this->pagination->create_links();		

                $this->pagination->initialize($config);

                $data['employees'] = $this->File_model->serach_file($search_data, $config["per_page"], $page);
                $data['year_list'] = $this->File_model->get_file_year();
                $data['area_list'] = $this->File_model->getAreaList();


                $this->load->view("layout/header");
                $this->load->view("layout/leftmenu");
                $this->load->view("view_file", $data);
                $this->load->view("layout/footer");
            
        }else{
        $this->check_logg();
        
        $data['Report'] = array();
        
        $data["page"] = $page = ($this->uri->segment(3)) ? $this->uri->segment(3) : 0;
        
        $config["base_url"] = base_url() . "file/file_listing";
        $data["total_rows"] = $config["total_rows"] = $this->File_model->get_last_five_file_count();
        $config["per_page"] = 10;
        $config["uri_segment"] = 3;
        $this->pagination->initialize($config);

        $data["links"] = $this->pagination->create_links(); 

        $data['employees'] = $this->File_model->get_last_five_files('all', $config["per_page"], $page);
        $data['year_list'] = $this->File_model->get_file_year();
        $data['area_list'] = $this->File_model->getAreaList();

        $this->load->view("layout/header");
        $this->load->view("layout/leftmenu");
        $this->load->view("view_file", $data);
        $this->load->view("layout/footer");
        
        }  
    }
    
    
    /* upload file function -18-02-2021*/
    public function uploadfile($file_barcode) {
	$this->check_logg();
        if ($empid != '') {
            $data['sb'] = $this->User_model->getFiledetail($file_barcode);
            $this->load->view("layout/header");
            $this->load->view("layout/leftmenu");
            $this->load->view("uploadfile", $data);
            $this->load->view("layout/footer");
        } else {
            redirect("user/view_employee");
        }
    }
    
    public function edit_file($file_barcode) {

        $this->check_logg();
        $this->load->view("layout/header");
        $this->load->view("layout/leftmenu");
        $data['file'] = $this->File_model->getsinglefile($file_barcode);
        $this->load->view("edit_file", $data);
        $this->load->view("layout/footer");
    }
    
    public function updatefile() {
        $this->check_logg();
		$file_barcode = $_POST['file_barcode'];
		//echo '<pre>';print_r($_POST);exit;
        $this->form_validation->set_rules('file_barcode', 'File Barcode', 'required');
        $this->form_validation->set_rules('file_name', 'File Name', 'required');
        $this->form_validation->set_rules('file_holder_name', 'Owner Name', 'required');
        $this->form_validation->set_rules('shelf_barcode', 'Shelf Barcode', 'required');
        $this->form_validation->set_rules('file_type', 'Type', 'required');
        $this->form_validation->set_rules('file_year', 'Year', 'required|trim|min_length[4]|max_length[4]');
        $this->form_validation->set_rules('file_address', 'Address', 'required|trim|min_length[10]|max_length[200]');
        $this->form_validation->set_rules('file_pincode', 'Pincode', 'required|trim|min_length[1]|max_length[6]');
        $this->form_validation->set_rules('file_area', 'Area', 'required');
        //$this->form_validation->set_rules('property_no', 'Property No', 'required');
        $this->form_validation->set_rules('property_area', 'Property Area', 'required');
        //$this->form_validation->set_rules('file_dealer', 'Dealer', 'required');

        if ($this->form_validation->run() != FALSE) {
            $file_barcode = $_POST['file_barcode'];
            $file_name = $_POST['file_name'];
            $file_holder_name = $_POST['file_holder_name'];
            $shelf_barcode = $_POST['shelf_barcode'];
            $file_type = $_POST['file_type'];
            $file_year = $_POST['file_year'];
            $file_address = $_POST['file_address'];
            $file_pincode = $_POST['file_pincode'];
            $file_area = $_POST['file_area'];
            $property_no = $_POST['property_no'];
            $property_area = $_POST['property_area'];
            $file_dealer = $_POST['file_dealer'];
            
            $check_shelfBarcode = $this->File_model->checkShelfBarcode($shelf_barcode);
            
            if($check_shelfBarcode->total == 0){
                $this->session->set_flashdata("error", "Shelf barcode is not exist or inactive.");
                redirect("file/edit_file/" . $file_barcode);
            }else{
            $data = array(
                "file_barcode" => $file_barcode,
                "file_name" => $file_name,
                "file_holder_name" => $file_holder_name,
                "shelf_barcode" => $shelf_barcode,
                "file_type" => $file_type,
                "file_year" => $file_year,
                "file_address" => $file_address,
                "file_pincode" => $file_pincode,
                "file_area" => $file_area,
                "property_no" => $property_no,
                "property_area" => $property_area,
                "file_dealer" => $file_dealer,
            );

            $result = $this->File_model->UpdateFileByID($data, $file_barcode);
            $this->session->set_flashdata('item', array('message' => 'File updated successfully', 'class' => 'success'));

                if ($file_barcode) {
                    redirect("file/file_listing");
                } else {
                    redirect("user/dashboard/");
                }
            }
        } else {
            $this->check_logg();
            $this->load->view("layout/header");
            $this->load->view("layout/leftmenu");
            $data['file'] = $this->File_model->getsinglefile($file_barcode);
            redirect("file/edit_file/" . $file_barcode);
            $this->load->view("layout/footer");
        }
    }
    public function deletefile($file_barcode){
        $this->check_logg();
        $result = $this->File_model->delete_file($file_barcode);
        $this->session->set_flashdata("error", "Record deleted successfully.");
        redirect("user/dashboard/");
    }
    public function getpincode($area_id){
        $result = $this->File_model->getPincode($area_id);
        echo $result->area_pincode;
    }
}
    ?>