<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class User extends CI_Controller {

	public function __construct()
	{
		parent::__construct();
		header("Cache-Control: no-cache, must-revalidate"); 
		header("Cache-Control: post-check=0, pre-check=0", false);
		header("Pragma: no-cache");
	}
	/**
	 * Index Page for this controller.
	 *
	 * Maps to the following URL
	 * 		http://example.com/index.php/welcome
	 *	- or -
	 * 		http://example.com/index.php/welcome/index
	 *	- or -
	 * Since this controller is set as the default controller in
	 * config/routes.php, it's displayed at http://example.com/
	 *
	 * So any other public methods not prefixed with an underscore will
	 * map to /index.php/welcome/<method_name>
	 * @see https://codeigniter.com/user_guide/general/urls.html
	 */
	 
	 public function checkinfo()
	{
		$this->load->view('checkinfo');
		
	}

	public function get_details()
	{
		$this->form_validation->set_rules('empcode', 'Mobile No.', 'required');
		
	    if ($this->form_validation->run() == FALSE)
		{
			
			$this->load->view("checkinfo");
			
		}
		else
		{
			
			$user=$this->input->post("empcode");
			
			$num= $this->User_model->check_records($user);
			
			if(count($num)>=1)
			{
				$this->session->set_userdata("user_id",$num[0]->user_name);

				$empid = $this->User_model->Get_employee_code($user);
				
				redirect("user/view_reports/".$empid);
			}
			else{
				$this->session->set_flashdata("error","Employee does not exists! Please register using link below");
				redirect("user/checkinfo");
			}
			
		}
		
	}

public function view_reports()
{
	
	$empid=$this->uri->segment(3);
	if($empid!='')
	{

		//$this->load->view("layout/header");
		//$this->load->view("layout/leftmenu");
		$this->load->view("view_reports");
		//$this->load->view("layout/footer");
	
	}
	else 
	{
		$this->session->set_flashdata("error","Failed to find employee reports!");
		redirect("user/checkinfo");
	}
	
}

public function index()
{
		
		
		$this->load->view('login');
		
	}
	
public function forgotpassword()
{
		
		
		$this->load->view('forgotpassword');
		
	}

public function enterotp()
{
		
		
		$this->load->view('otp');
		
	}
public function otpsubmit()
{
	if($this->input->post("otp") == $this->session->userdata("otp"))
	{
		
		$query=$this->db->query("select employee_code,role from drm_employee where mobile='".$this->session->userdata("mobile")."'");
		$rs=$query->result();
		       if($rs[0]->role==1)
				{
					$role='Supervisor';
					
				}
				
				elseif($rs[0]->role==2)
				{
					$role='Operator';
					
				}
				
				elseif($rs[0]->role==3)
				{
					$role='Employee';
					
				}
				else{
					$role='Admin';
					
				}
		$this->session->set_userdata("user_type",$role);
		$this->session->set_userdata("user_id",$rs[0]->employee_code);
				
		$this->session->set_userdata("otp","");
		
		redirect("user/dashboard");
		
		
	}
	else{
		$this->session->set_flashdata("error","Invalid OTP entered!");
		redirect("user/enterotp");
	}
	
	
}
	
function clean($string) {
   $string = str_replace(' ', '-', $string); // Replaces all spaces with hyphens.

   return preg_replace('/[^A-Za-z0-9\-]/', '', $string); // Removes special chars.
}


public function recoverpassword(){
	
	

 
         $phonee = $this->input->post("mobile");
		 
		 $query=$this->db->query("select * from drm_employee where mobile='$phonee'");
		 $rs=$query->result();
		 
		 if(count($rs)>=1)
		 {
         $password=rand();
         $user="test_rail";

         $pass="HTL@2020";

         $sender="BHRAIL";


         if(strlen($phonee))

         {

        $message="Your onetime password is ".$password;
        $parameters="user=$user&pass=$pass&sender=$sender&phone=$phonee&text=$message&priority=ndnd&stype=normal";

        $url="http://msg.hashtaglabs.in/api/sendmsg.php?";

        $ch = curl_init($url);

        curl_setopt($ch, CURLOPT_POSTFIELDS, "user=$user&pass=$pass&sender=$sender&phone=$phonee&text=$message&priority=ndnd&stype=normal");


        curl_setopt($ch, CURLOPT_POST,1);

        curl_setopt($ch, CURLOPT_POSTFIELDS,$parameters);

        curl_setopt($ch, CURLOPT_FOLLOWLOCATION,1);

        curl_setopt($ch,CURLOPT_HEADER,0);  // DO NOT RETURN HTTP HEADERS

        curl_setopt($ch, CURLOPT_RETURNTRANSFER,1);  // RETURN THE CONTENTS OF THE CALL

        $return_val = curl_exec($ch);
        $this->session->set_userdata("otp",$password);
        $this->session->set_userdata("mobile",$phonee);
		redirect("user/enterotp");

        }
		 }
	
}

public function check_logg()
{
		if($this->session->userdata("user_type")!='Admin' && $this->session->userdata("user_type")!='Employee' && $this->session->userdata("user_type")!='Supervisor' && $this->session->userdata("user_type")!='Operator' && $this->session->userdata("user_type")!='Verifier')
		{
			
			redirect("user");
			
		}
		
		
	}
	


public function login_process()
{
		$this->form_validation->set_rules('username', 'Username', 'required');
		$this->form_validation->set_rules('password', 'Password', 'required');
		
		
	    if ($this->form_validation->run() == FALSE)
		{
			
			$this->load->view("login");
			
		}
		else
		{
			
			
			$user=$this->input->post("username");
			$pass=md5($this->input->post("password"));
		
			
			$num= $this->User_model->login_process_check($user,$pass);
			
			if(count($num)>=1)
			{
				$this->session->set_userdata("user_id",$num[0]->user_name);

				if($num[0]->role==1)
				{
					$role='Supervisor';
					
				}
				
				elseif($num[0]->role==2)
				{
					$role='Operator';
					
				}
				
				elseif($num[0]->role==3)
				{
					$role='Employee';
					
				}
				elseif($num[0]->role==4)
				{
					$role='Verifier';
					
				}
				else{
					$role='Admin';
					
				}
			
				$this->session->set_userdata("user_type",$role);
				
				redirect("user/dashboard");
			}
			else{
				$this->session->set_flashdata("error","You have entered incorrect username or password!");
				redirect("user");
			}
			
		}
		
	}
	


public function dashboard()
{
		
		$this->check_logg();
		$this->load->view("layout/header");
		$this->load->view("layout/leftmenu");
		$this->load->view("dashboard");
		$this->load->view("layout/footer");
	
	}	
	


public function employee()
{

		$this->check_logg();
		$this->load->view("layout/header");
		$this->load->view("layout/leftmenu");
		$this->load->view("employee");
		$this->load->view("layout/footer");
	
	}
	

public function edit_employee($id)
{

		$this->check_logg();
		$this->load->view("layout/header");
		$this->load->view("layout/leftmenu");
		$data['singleemployee']=$this->User_model->getsingleemployee($id);
		$this->load->view("edit_employee",$data);
		$this->load->view("layout/footer");
	
	}
	
public function generateRandomString($length = 10) {
    $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    $charactersLength = strlen($characters);
    $randomString = '';
    for ($i = 0; $i < $length; $i++) {
        $randomString .= $characters[rand(0, $charactersLength - 1)];
    }
    return $randomString;
}

public function make_employee()
{
	
			
		
		$this->form_validation->set_rules('employee_code', 'Employee Code', 'required');
		$this->form_validation->set_rules('prefix', 'Prefix', 'required');
		$this->form_validation->set_rules('employee_name', 'Employee Name', 'required');
		$this->form_validation->set_rules('file_code', 'File Code', 'trim|max_length[10]');
		$this->form_validation->set_rules('gender', 'Gender', 'required');
		$this->form_validation->set_rules('dob', 'Date of birth', 'required');
		$this->form_validation->set_rules('email', 'Email', 'trim|valid_email');
		$this->form_validation->set_rules('mobile', 'Mobile', 'trim|min_length[10]|max_length[10]');
		$this->form_validation->set_rules('dept', 'Department', 'required');
		$this->form_validation->set_rules('desg', 'Designation', 'required');
		$this->form_validation->set_rules('pan', 'Pan No', 'trim|min_length[10]|max_length[10]');
		$this->form_validation->set_rules('aadhar', 'Aadhar Card no', 'trim|min_length[12]|max_length[12]');
		$this->form_validation->set_rules('role', 'User Role', 'required');
		
	
		if ($this->form_validation->run() != FALSE)
		{		
		$employee_code =$_POST['employee_code'];
		$prefix        =$_POST['prefix'];
		$employee_name =$_POST['employee_name'];
		$file_code	   =$_POST['file_code'];
		$gender        =$_POST['gender'];
		$dob           =$_POST['dob'];
		$email         =$_POST['email'];
		$mobile        =$_POST['mobile'];
		$dept  	       =$_POST['dept'];
		$desg  	       =$_POST['desg'];
		$pan           =$_POST['pan'];
		$aadhar        =$_POST['aadhar'];
		$role          =$_POST['role'];
		
		$data=array(
		   "employee_code" =>$employee_code,
		   "prefix"        =>$prefix,
		   "employee_name" =>$employee_name,
		   "code"		   =>$file_code,
		   "gender"        =>$gender,
		   "dob"           =>$dob,
		   "email"         =>$email,
		   "mobile"        =>$mobile,
		   "emp_department"=>$dept,
		   "emp_designation"=>$desg,
		   "pan"           =>$pan,
		   "aadhar"        =>$aadhar,
		   "role"          =>$role,
		
		);
			$query=$this->db->query("select * from drm_employee where employee_code='$employee_code'");
			$num=$query->num_rows();
		if($num<1)
		{
		$password=$this->generateRandomString($length = 10);
		$this->User_model->makeLogin($role,$employee_code,$password);
		
		$this->User_model->add_employee($data, $employee_code);
		$this->session->set_flashdata("error","Employee added successfully.");
		$message="Dear ".$employee_name.",<br>You have been successfull registered.<br> Your User name: ".$employee_code." <br>Password: ".$password;
		$this->sendsmtpemail_app("info@hashtaglabs.biz","NR LKO Drm",$email,"registration successfull",$message);
		
		redirect("user/employee");
		}
		else{
			$this->session->set_flashdata("error","Duplicate Employeee code not allowed.");
			redirect("user/employee");
			
		}
		}
		else{
		$this->check_logg();
		$this->load->view("layout/header");
		$this->load->view("layout/leftmenu");
		$this->load->view("employee");
		$this->load->view("layout/footer");
			
		}
		
		
	}



public function view_employee()
	{
		
		$this->check_logg();
		$data['employee']=$this->User_model->employeelist();
		$this->load->view("layout/header");
		$this->load->view("layout/leftmenu");
		$this->load->view("employeelist",$data);
		$this->load->view("layout/footer");
	
	}
	
public function view_supervisor()
	{
		
		$this->check_logg();
		$data['employee']=$this->User_model->employeelist();
		$this->load->view("layout/header");
		$this->load->view("layout/leftmenu");
		$this->load->view("supervisorlist",$data);
		$this->load->view("layout/footer");
	
	}
	
	
public function view_operator()
	{
		
		$this->check_logg();
		$data['employee']=$this->User_model->employeelist();
		$this->load->view("layout/header");
		$this->load->view("layout/leftmenu");
		$this->load->view("operatorlist",$data);
		$this->load->view("layout/footer");
	
	}
	
	
public function uploadservice()
	{
		
		if(!empty($_FILES['image']))
		{
			$ext = pathinfo($_FILES['image']['name'],PATHINFO_EXTENSION);
			$image = time().'sb.'.$ext;
			move_uploaded_file($_FILES["image"]["tmp_name"], 'uploads/'.$image);
			echo "Image uploaded successfully as ".$image;
	    }
	else
		{
			echo "Image Is Empty";
		}
		
		
	}
	
	
public function uploadservice2()
	{
		
		if(!empty($_FILES['image']))
		{
			$ext = pathinfo($_FILES['image']['name'],PATHINFO_EXTENSION);
			$image = time().'lr.'.$ext;
			move_uploaded_file($_FILES["image"]["tmp_name"], 'LeaveReport/'.$image);
			echo "Image uploaded successfully as ".$image;
	    }
	else
		{
			echo "Image Is Empty";
		}
		
		
	}
	
	
public function uploadservice3()
    {
		
	
		
		if(!empty($_FILES['image']))
		{
			$ext = pathinfo($_FILES['image']['name'],PATHINFO_EXTENSION);
			$image = time().'ap.'.$ext;
			move_uploaded_file($_FILES["image"]["tmp_name"], 'uploads/'.$image);
			echo "Image uploaded successfully as ".$image;
	    }
	else
		{
			echo "Image Is Empty";
		}
		
		
	}
		
	
	
public function getemployees()
    {
	$employee=$this->User_model->getemployees();
	/* foreach ($employee as $pd)
			{
			$emp[] = array(
			'employee_code' => $pd->employee_code,
			'employee_name' => $pd->employee_name,
			'gender'        => $pd->gender,
			'email'         => $pd->email,
			'mobile'        => $pd->mobile);
            }
		
		
		$json= json_encode($emp, TRUE) */;	
	return $employee;
	}
	
	
	
	
public function uploadservices()
{
$this->check_logg();
$empid=$this->uri->segment(3);
if($empid!='')
{
$data['sb']=$this->User_model->getSBdetail($empid);
$this->load->view("layout/header");
$this->load->view("layout/leftmenu");
$this->load->view("uploadservices", $data);
$this->load->view("layout/footer");
}
else {
redirect("user/view_employee");
}
}




public function viewdocuments()
{
$this->check_logg();
$empid=$this->uri->segment(3);
if($empid!='')
{
$this->load->view("layout/header");
$this->load->view("layout/leftmenu");
$this->load->view('viewdocuments');
$this->load->view("layout/footer");
}
else 
{
redirect("user/view_employee");
}
}




public function upload_emp_lr()
{
$this->check_logg();
$empid=$this->uri->segment(3);
if($empid!='')
{
$data['lr']=$this->User_model->getLRdetail($empid);
$this->load->view("layout/header");
$this->load->view("layout/leftmenu");
$this->load->view("upload_emp_lr", $data);
$this->load->view("layout/footer");
}
else
{
redirect("user/view_employee");
}
}


public function upload_sr()
{
$this->check_logg();
$empid=$this->uri->segment(3);
if($empid!='')
{
$data['sr']=$this->User_model->getSRdetail($empid);
$this->load->view("layout/header");
$this->load->view("layout/leftmenu");
$this->load->view("upload_sr", $data);
$this->load->view("layout/footer");
}
else
{
redirect("user/view_employee");
}
}


public function uploadservicebook()
{
	$empcode = $this->User_model->getsingleemployee($this->uri->segment(3))->employee_code;
	if (!file_exists("uploads/".$empcode)) {
mkdir("uploads/".$empcode, 0755);
mkdir("uploads/".$empcode."/service_book", 0755);
mkdir("uploads/".$empcode."/leave_report", 0755);
mkdir("uploads/".$empcode."/apar", 0755);
mkdir("uploads/".$empcode."/sr", 0755);
}
	array_multisort($_FILES['sbook']['size'], SORT_DESC, SORT_STRING,$_FILES['sbook']['name'], SORT_STRING);
	$empid=$this->uri->segment(3);	
	extract($_POST);
	$error=array();
	$extension=array("jpeg","jpg","png","gif","PNG","JPG","JPEG");
	foreach($_POST['check'] as $key=>$tmp_name)
		{
		$key2=$_POST['check'][$key];	 

		$file_name=$_FILES["sbook"]["name"][$key2];

		 $file_tmp=$_FILES["sbook"]["tmp_name"][$key2];

		$ext=pathinfo($file_name,PATHINFO_EXTENSION);
		$newfile_name=$empcode."-SR-".$_POST['pageno'][$key2].".".$ext;

		if(in_array($ext,$extension))
			{
				if(!file_exists("uploads/".$empcode."/service_book/".$newfile_name))
				{
                  move_uploaded_file($file_tmp=$_FILES["sbook"]["tmp_name"][$key2],"uploads/".$empcode."/service_book/".$newfile_name);
				  $pageno= $_POST['pageno'][$key2];
				  $result=$this->User_model->saveservicebook($empid,$newfile_name,$pageno,1);
				}
			    else
			    {
					$filename=basename($file_name,$ext);
					$newfile_name=$empcode."-SR-".$_POST['pageno'][$key2]."-V".$this->User_model->getPagerVersionServiceBook($empid,$_POST['pageno'][$key2]).".".$ext;
					move_uploaded_file($file_tmp=$_FILES["sbook"]["tmp_name"][$key2],"uploads/".$empcode."/service_book/".$newfile_name);
					$pageno=$_POST['pageno'][$key2];
					$result=$this->User_model->saveservicebook($empid,$newfile_name,$pageno,$this->User_model->getPagerVersionServiceBook($empid,$_POST['pageno'][$key2]));
			   }
			}
		else
		{
		array_push($error,"$file_name, ");
		} 
}

if($result > 0)
{ 
	$this->session->set_flashdata('item', array('message' => 'Service book added successfully','class' => 'success'));
	redirect("user/uploadservices/".$empid);
} 
else 
{
	$this->session->set_flashdata('item', array('message' => 'Service book update successfully','class' => 'success'));
	redirect("user/uploadservices/".$empid);	
	
} 

}


public function uploademplr()
	{
		$empcode = $this->User_model->getsingleemployee($this->uri->segment(3))->employee_code;
		if (!file_exists("uploads/".$empcode)) {
mkdir("uploads/".$empcode, 0755);
mkdir("uploads/".$empcode."/service_book", 0755);
mkdir("uploads/".$empcode."/leave_report", 0755);
mkdir("uploads/".$empcode."/apar", 0755);
mkdir("uploads/".$empcode."/sr", 0755);
}
	$empid=$this->uri->segment(3);	
	extract($_POST);
	$error=array();
	$extension=array("jpeg","jpg","png","gif");

	foreach($_POST['check'] as $key=>$tmp_name)
		{
		$key2=$_POST['check'][$key];
		$file_name=$_FILES["sbook"]["name"][$key2];
		$file_tmp=$_FILES["sbook"]["tmp_name"][$key2];
		$ext=pathinfo($file_name,PATHINFO_EXTENSION);
		$newfile_name=$empcode."-LR-".$_POST['pageno'][$key2].".".$ext;
		$image_name=time().str_replace(" ","",$newfile_name);

		if(in_array($ext,$extension))
			{
				if(!file_exists("uploads/".$empcode."/leave_report/".$newfile_name))
				{         
					move_uploaded_file($file_tmp=$_FILES["sbook"]["tmp_name"][$key2],"uploads/".$empcode."/leave_report/".$newfile_name);
					$pageno= $_POST['pageno'][$key2];

					$result=$this->User_model->saveemplr($empid,$newfile_name,$pageno,1);
				} 
				else 
				{  
					$filename=basename($file_name,$ext);   
							 
					$newfile_name=$empcode."-LR-".$_POST['pageno'][$key2]."-V".$this->User_model->getPagerVersionleavereport($empid,$_POST['pageno'][$key2]).".".$ext;
					$image_name=time().str_replace(" ","",$newfile_name);
											
					move_uploaded_file($file_tmp=$_FILES["sbook"]["tmp_name"][$key2],"uploads/".$empcode."/leave_report/".$newfile_name);
					$pageno=$_POST['pageno'][$key2];
					$result=$this->User_model->saveemplr($empid,$newfile_name,$pageno,$this->User_model->getPagerVersionleavereport($empid,$_POST['pageno'][$key2]));

			}
		}else
		{
		array_push($error,"$file_name, ");
		}
	}

	if($result > 0)
	{ 
	$this->session->set_flashdata('item', array('message' => 'Leave report added successfully','class' => 'success'));
	redirect("user/upload_emp_lr/".$empid);
	} 
	else {
	$this->session->set_flashdata('item', array('message' => 'Leave report update successfully','class' => 'success'));
	redirect("user/upload_emp_lr/".$empid);	
		
	}
}



public function uploadsr()
	{
		$empcode = $this->User_model->getsingleemployee($this->uri->segment(3))->employee_code;
		if (!file_exists("uploads/".$empcode)) {
mkdir("uploads/".$empcode, 0755);
mkdir("uploads/".$empcode."/service_book", 0755);
mkdir("uploads/".$empcode."/leave_report", 0755);
mkdir("uploads/".$empcode."/apar", 0755);
mkdir("uploads/".$empcode."/sr", 0755);
}
	// if (!file_exists("uploads/".$empcode."/sr")) {
	// 	mkdir("uploads/".$empcode."/sr", 0755);
	// }
	
	$empid=$this->uri->segment(3);	
	extract($_POST);
	$error=array();
	$extension=array("jpeg","jpg","png","gif");

	foreach($_POST['check'] as $key=>$tmp_name)
		{
		$key2=$_POST['check'][$key];
		$file_name=$_FILES["sbook"]["name"][$key2];
		$file_tmp=$_FILES["sbook"]["tmp_name"][$key2];
		$ext=pathinfo($file_name,PATHINFO_EXTENSION);
		$newfile_name=$empcode."-SR-".$_POST['pageno'][$key2].".".$ext;
		$image_name=time().str_replace(" ","",$newfile_name);

		if(in_array($ext,$extension))
			{
				if(!file_exists("uploads/".$empcode."/sr/".$newfile_name))
				{         
					move_uploaded_file($file_tmp=$_FILES["sbook"]["tmp_name"][$key2],"uploads/".$empcode."/sr/".$newfile_name);
					$pageno= $_POST['pageno'][$key2];

					$result=$this->User_model->savesr($empid,$newfile_name,$pageno,1);
				} 
				else 
				{  
					$filename=basename($file_name,$ext);   
							 
					$newfile_name=$empcode."-SR-".$_POST['pageno'][$key2]."-V".$this->User_model->getPagerVersionsr($empid,$_POST['pageno'][$key2]).".".$ext;
					$image_name=time().str_replace(" ","",$newfile_name);
											
					move_uploaded_file($file_tmp=$_FILES["sbook"]["tmp_name"][$key2],"uploads/".$empcode."/sr/".$newfile_name);
					$pageno=$_POST['pageno'][$key2];
					$result=$this->User_model->savesr($empid,$newfile_name,$pageno,$this->User_model->getPagerVersionsr($empid,$_POST['pageno'][$key2]));

			}
		}else
		{
		array_push($error,"$file_name, ");
		}
	}

	if($result > 0)
	{ 
	$this->session->set_flashdata('item', array('message' => 'SR Attachment added successfully','class' => 'success'));
	redirect("user/upload_sr/".$empid);
	} 
	else {
	$this->session->set_flashdata('item', array('message' => 'SR Attachment update successfully','class' => 'success'));
	redirect("user/upload_sr/".$empid);	
		
	}
}




public function deleteemp($id)
{
$result = $this->User_model->del_emp($id);

$role=$this->uri->segment(4);
$this->session->set_flashdata("error","Record deleted successfully.");
if($role==1)
{
redirect("user/view_supervisor");

}

if($role==2)
{

redirect("user/view_operator");
}

if($role==3)
{

redirect("user/view_employee");
}

}
	
	
	
	
public function updateemployee()
{
		$this->form_validation->set_rules('employee_code', 'Employee Code', 'required');
		$this->form_validation->set_rules('prefix', 'Prefix', 'required');
		$this->form_validation->set_rules('employee_name', 'Employee Name', 'required');
		$this->form_validation->set_rules('file_code', 'File Code', 'trim|max_length[10]');
		$this->form_validation->set_rules('gender', 'Gender', 'required');
		$this->form_validation->set_rules('dob', 'Date of birth', 'required');
		$this->form_validation->set_rules('email', 'Email', 'trim|valid_email');
		$this->form_validation->set_rules('mobile', 'Mobile', 'trim|min_length[10]|max_length[10]');
		$this->form_validation->set_rules('dept', 'Department', 'required');
		$this->form_validation->set_rules('desg', 'Designation', 'required');
		$this->form_validation->set_rules('pan', 'Pan No', 'trim|min_length[10]|max_length[10]');
		$this->form_validation->set_rules('aadhar', 'Aadhar Card no', 'trim|min_length[12]|max_length[12]');

		$empid = $_POST['empid'];	

		if ($this->form_validation->run() != FALSE)
		{	
		$employee_code =$_POST['employee_code'];
		$prefix        =$_POST['prefix'];
		$employee_name =$_POST['employee_name'];
		$file_code	   =$_POST['file_code'];
		$gender        =$_POST['gender'];
		$dob           =$_POST['dob'];
		$email         =$_POST['email'];
		$mobile        =$_POST['mobile'];
		$dept  	       =$_POST['dept'];
		$desg  	       =$_POST['desg'];
		$pan           =$_POST['pan'];
		$aadhar        =$_POST['aadhar'];
		$role          =$_POST['role'];
		
		$data=array(
		   "employee_code" =>$employee_code,
		   "prefix"        =>$prefix,
		   "employee_name" =>$employee_name,
		   "code"		   =>$file_code,
		   "gender"        =>$gender,
		   "dob"           =>$dob,
		   "email"         =>$email,
		   "mobile"        =>$mobile,
		   "emp_department"=>$dept,
		   "emp_designation"=>$desg,
		   "pan"           =>$pan,
		   "aadhar"        =>$aadhar,
		   //"role"          =>$role,
		
		);

             $result = $this->User_model->UpdateEmployeeByID($data, $empid);
			 $this->session->set_flashdata('item', array('message' => 'Employee update successfully','class' => 'success'));
redirect("user/view_employee");
		}
		else{
	    $this->check_logg();
		$this->load->view("layout/header");
		$this->load->view("layout/leftmenu");
		$data['singleemployee']=$this->User_model->getsingleemployee($empid);
		redirect("user/edit_employee/".$empid);
		$this->load->view("layout/footer");
			
		}

}

				   
public function upload_apar()
{
$this->check_logg();
$empid=$this->uri->segment(3);
if($empid!='')
{

$this->load->view("layout/header");
$this->load->view("layout/leftmenu");
$this->load->view("upload_apar");
$this->load->view("layout/footer");
}
else 
{
redirect("user/view_employee");
}
}




       
public function uploadapart_report()
{
	$empcode = $this->User_model->getsingleemployee($this->uri->segment(3))->employee_code;
	if (!file_exists("uploads/".$empcode)) {
mkdir("uploads/".$empcode, 0755);
mkdir("uploads/".$empcode."/service_book", 0755);
mkdir("uploads/".$empcode."/leave_report", 0755);
mkdir("uploads/".$empcode."/apar", 0755);
mkdir("uploads/".$empcode."/sr", 0755);
}
$empid=$this->uri->segment(3);	
extract($_POST);
$error=array();
$extension=array("jpeg","jpg","png","gif");
foreach($_POST['check'] as $key=>$tmp_name)
		{
		$key2=$_POST['check'][$key];
     			$from =$_POST['years'];
               
                $file_name=$_FILES["sbook"]["name"][$key2];
                $file_tmp=$_FILES["sbook"]["tmp_name"][$key2];
                $ext=pathinfo($file_name,PATHINFO_EXTENSION);
				$newfile_name=$empcode."-AR-".$from."-".$_POST['pageno'][$key2].".".$ext;
	
				$image_name=time().str_replace(" ","",$newfile_name);
                if(in_array($ext,$extension))
                {
if(!file_exists("uploads/".$empcode."/apar/".$newfile_name))
{         
move_uploaded_file($file_tmp=$_FILES["sbook"]["tmp_name"][$key2],"uploads/".$empcode."/apar/".$newfile_name);
$pageno= $_POST['pageno'][$key2];
$result=$this->User_model->saveaparreport($empid,$newfile_name,$pageno,$from,1);
 }
else
{
$filename=basename($file_name,$ext);
$newfile_name=$empcode."-AR-".$from."-".$_POST['pageno'][$key2]."-V".$this->User_model->getPagerVersionapar($empid,$_POST['pageno'][$key2],$from).".".$ext;
move_uploaded_file($file_tmp=$_FILES["sbook"]["tmp_name"][$key2],"uploads/".$empcode."/apar/".$newfile_name);
$pageno=$_POST['pageno'][$key2];

$result=$this->User_model->saveaparreport($empid,$newfile_name,$pageno,$from,$this->User_model->getPagerVersionapar($empid,$_POST['pageno'][$key2],$from));

}
}else
{
array_push($error,"$file_name, ");
}}





if($result > 0)
{ 
$this->session->set_flashdata('item', array('message' => 'Apar report added successfully','class' => 'success'));
redirect("user/upload_apar/".$empid);
} 
else 
{
$this->session->set_flashdata('item', array('message' => 'Apar report update successfully','class' => 'success'));
 redirect("user/upload_apar/".$empid);	
}
		
}  



public function deleteleavereport()
{
	$id=$this->uri->segment(3);
	$empid=$this->uri->segment(4);
	$this->check_logg();
	if($id!='')
	{
		$this->User_model->deleteleavereport($id);
		$this->session->set_flashdata('item', array('message' => 'Leave report page deleted successfully.','class' => 'success'));
		redirect("user/upload_emp_lr/".$empid);
	}
	else{
		$this->session->set_flashdata('item', array('message' => 'Some error occured.','class' => 'error'));
		redirect("user/upload_emp_lr/".$empid);
	}
	
	
}

public function deleteservicebook()
{
	$id=$this->uri->segment(3);
	$empid=$this->uri->segment(4);
	$this->check_logg();
	if($id!='')
	{
		$this->User_model->deleteservicebook($id);
		$this->session->set_flashdata('item', array('message' => 'Service book page deleted successfully.','class' => 'success'));
		redirect("user/uploadservices/".$empid);
	}
	else{
		$this->session->set_flashdata('item', array('message' => 'Some error occured.','class' => 'error'));
		redirect("user/uploadservices/".$empid);
	}
	
	
}	



public function deleteapar()
{
	$id=$this->uri->segment(3);
	$empid=$this->uri->segment(4);
	$this->check_logg();
	if($id!='')
	{
		$this->User_model->deleteapar($id);
		$this->session->set_flashdata('item', array('message' => 'APAR page deleted successfully.','class' => 'success'));
		redirect("user/upload_apar/".$empid);
	}
	else{
		$this->session->set_flashdata('item', array('message' => 'Some error occured.','class' => 'error'));
		redirect("user/upload_apar/".$empid);
	}
	
	
}  


public function deletesr()
{
	$id=$this->uri->segment(3);
	$empid=$this->uri->segment(4);
	$this->check_logg();
	if($id!='')
	{
		$this->User_model->deletesr($id);
		$this->session->set_flashdata('item', array('message' => 'SR page deleted successfully.','class' => 'success'));
		redirect("user/upload_sr/".$empid);
	}
	else{
		$this->session->set_flashdata('item', array('message' => 'Some error occured.','class' => 'error'));
		redirect("user/upload_apar/".$empid);
	}
	
	
}  


public function viewservicebook()
{
	
	$this->check_logg();
	$empid=$this->uri->segment(3);
	if($empid!='')
	{

		$this->load->view("layout/header");
		$this->load->view("layout/leftmenu");
		$this->load->view("viewservicebooks");
		$this->load->view("layout/footer");
	
	}
	else 
	{
		redirect("user/view_employee");
	}
	
	
}


public function viewleavereports()
{
	
	$this->check_logg();
$empid=$this->uri->segment(3);
if($empid!='')
{
$data['lr']=$this->User_model->getLRdetail($empid);
$this->load->view("layout/header");
$this->load->view("layout/leftmenu");
$this->load->view("viewleavereports", $data);
$this->load->view("layout/footer");
}
else
{
redirect("user/view_employee");
}
	
	
}

public function viewapar()
{
	
	$this->check_logg();
	$empid=$this->uri->segment(3);
	if($empid!='')
	{

		$this->load->view("layout/header");
		$this->load->view("layout/leftmenu");
		$this->load->view("viewapar");
	    $this->load->view("layout/footer");
	}
	else 
	{
		redirect("user/view_employee");
	}
	
	
}

public function viewsr()
{
	
	$this->check_logg();
$empid=$this->uri->segment(3);
if($empid!='')
{
$data['sr']=$this->User_model->getSRdetail($empid);
$this->load->view("layout/header");
$this->load->view("layout/leftmenu");
$this->load->view("viewsr", $data);
$this->load->view("layout/footer");
}
else
{
redirect("user/view_employee");
}
	
	
}

public function getservicebookbyid()
{
	
	$id=$this->uri->segment(3);
	$empid=$this->uri->segment(4);
	$query=$this->db->query("select * from employee_service_book where sb_id='$id'");
	$rs=$query->result();
	echo $rs[0]->filename;
	
}

public function checkempid()
{
	$id=$_POST['id'];
	$query=$this->db->query("select * from drm_employee where employee_code='$id'");
	$num=$query->num_rows();
	echo $num;
	
	
}

public function logout()
{
	$this->session->sess_destroy();
	$this->session->set_flashdata("error","You have been successfully logged out!");
	$this->load->view("login");
	
}



public function sendsmtpemail_app($from,$name,$to,$subject,$message)
{
            $this->load->library('email');
          
         
            $config['protocol']    = 'smtp';
            $config['smtp_host']    = 'ssl://smtp.gmail.com';
            $config['smtp_port']    = '465';
            $config['smtp_timeout'] = '7';
            $config['smtp_user']    = 'chctelecom17@gmail.com';
            $config['smtp_pass']    = 'chctelecom@123';
            $config['charset']    = 'utf-8';
            $config['newline']    = "\r\n";
            $config['mailtype'] = 'html'; // or html
            $config['validation'] = FALSE;
            
            $this->email->initialize($config);
            $this->email->from($from,$name);
            $this->email->to($to); 
            $this->email->subject($subject);

           $this->email->message($message);  
            $send = $this->email->send();
}

public function view_report_log()
	{	
		$doctype='SB';
		$empid = $this->uri->segment('3');
		$data['sb_log'] = $this->User_model->get_sb_report_log($empid, $doctype);
		$this->load->view("layout/header");
		$this->load->view("layout/leftmenu");
		$this->load->view("report_log", $data);
		$this->load->view("layout/footer");

	}

public function view_report_log_ajax()
	{	
		$empid = $this->input->post('empid');
		$doctype = $this->input->post('typ');
		$data['sb_log'] = $this->User_model->get_sb_report_log($empid, $doctype);
		$data['type'] = $doctype;
		$this->load->view("view_report_log_ajax", $data);
	}	

public function search_employee()
	{	
		$this->load->view("layout/header");
		$this->load->view("layout/leftmenu");
		if(isset($_POST['search'])) {
			$this->form_validation->set_rules('search', 'Employee/Emp. Code', 'required|min_length[3]');
			if ($this->form_validation->run() != FALSE)
		{	
			$search = $this->input->post('search');

		$data['employee'] = $this->User_model->search_employee($search);
				
		$this->load->view("search_employee", $data);
	} else {
		$this->check_logg();
		$this->load->view("search_employee");
	}
		
		} else {
		$this->load->view("search_employee");

		}

		$this->load->view("layout/footer");

	}



	public function generate_pdf($emp) {
		
		$this->load->library('Fpdf_gen');
		$pdf = new FPDF('P','mm');
    	$pdf->AddPage('P'); 

		$emp = explode("_",$emp);
		$empcode = $this->User_model->getsingleemployee($emp[1])->employee_code;
		$empname = $this->User_model->getsingleemployee($emp[1])->employee_name;
		$title = $this->User_model->get_pdf_title($emp[0]);

    	//$pdf->SetDisplayMode(real,'default');
    	$pdf->SetFont('Arial','B',18);

		$pdf->cell(200,200,$title,0,0,'C');
		if(!empty($emp[2])) {
			$pdf->Ln(8);
			$pdf->cell(200,200,'('.$emp[2].')',0,0,'C');
		}
		$pdf->Ln(20);
		$pdf->SetFont('Arial','B',14);
		$pdf->cell(200,200,'EMPLOYEE NAME : '.$empname,0,0,'C');
		$pdf->Ln(10);
		$pdf->cell(200,200,'EMPLOYEE CODE : '.$empcode,0,0,'C');
		

	switch($emp[0]) {
    case 'SB':
        $folder = 'service_book';
        $reports = $this->User_model->getallservicebook($emp[1]);
        break;
    case 'LR':
        $folder = 'leave_report';
        $reports = $this->User_model->getallleavereport($emp[1]);
        break;
    case 'APAR':
        $folder = 'apar';
        $reports = $this->User_model->getApardetail($emp[1],$emp[2]);
        break;
    case 'SR':
        $folder = 'sr';
        $reports = $this->User_model->getSRdetail($emp[1]);
        break;
	}
		
    	
    	foreach($reports as $sb)
					{
			
		$pdf->AddPage();
        $image1 = base_url().'uploads/'.$empcode.'/'.$folder.'/'.$sb->filename;
        $this->Header($pdf, $sb);
		$pdf->Image($image1, 10, 20, 190, 270);
        
    	}
    	echo $pdf->Output($emp[0].'-'.$empcode.'.pdf','D');
	}


	public function Header($pdf, $sb)
		{
    		// Select Arial bold 15
    		$pdf->SetFont('Arial','',10);
    		$pdf->Cell(90,0,'Page : '.$sb->pageno,0,0,'L');
    		$pdf->Cell(100,0,'Upload Time : '.date('d M Y H:i:s', strtotime($sb->uploaded_at)),0,0,'R');
    		// Line break
    		//$pdf->Ln(10);
		}

	public function approve_reject()
		{	
			$this->load->library('Class_activity');
			if($this->input->post('submit') == 'Approve') {
				$status = 1;
			} else {
				$status = 0;
			}
			$data = array(
				'emp_id'		=>	$this->input->post('emp_id'),
				'doc_type'		=>	$this->input->post('doc_type'),
				'status'		=>	$status,
				'remark'		=>	$this->input->post('remark'),
				'verified_by'	=>	$this->session->userdata('user_id')
				);
			
			if($this->input->post('id') != '') {
				$result = $this->User_model->update_verification($data, $this->input->post('id'));
				$last_id = $this->input->post('id');
				$action = "UPDVER";
			} else {
				$result = $this->User_model->add_verification($data);
				$last_id = $this->db->insert_id();
				$action = "ADDVER";
			}
			
			if($result > 0) {

				$ObjAction = new Class_activity();
$ObjAction->activity_action = $action;
$ObjAction->activity_user_id = $this->session->userdata('user_id');

$ObjAction->login_id = $this->session->userdata('user_id');
$ObjAction->verification_id = $last_id;
$ObjAction->emp_id = $this->input->post('emp_id');
$ObjAction->status = $status;
$ObjAction->remark = $this->input->post('remark');
$ObjAction->verified_by = $this->session->userdata('user_id');
$activity_query = $ObjAction->LogDetails();

           $query = $this->db->query($activity_query);

				    if($status == 1) {
				    	$this->session->set_flashdata('item', array('message' => 'Documents approved successfully','class' => 'success'));
				    } else {
				    	$this->session->set_flashdata('item', array('message' => 'Documents rejected successfully','class' => 'success'));
				    }	
				} else {
					$this->session->set_flashdata("error","Failed to approve/reject documents.");
				}
			switch($this->input->post('doc_type')) {
    case 'SB':
        redirect("user/viewservicebook/".$this->input->post('emp_id'));
        break;
    case 'LR':
        redirect("user/viewleavereports/".$this->input->post('emp_id'));
        break;
    case 'APAR':
         redirect("user/viewapar/".$this->input->post('emp_id'));
        break;
    case 'SR':
         redirect("user/viewsr/".$this->input->post('emp_id'));
        break;
			}
		}

}
