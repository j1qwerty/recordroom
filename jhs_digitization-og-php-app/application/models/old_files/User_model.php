<?php /* Copyright (c) 2017 onwards, HashTag Labs Private Limited, India
 *
 * Permission is hereby granted for using of this software code only with written permission
 * from HashTag Labs Private Limited, India or Team HashTag Labs
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 * @package	          VisitorMaps by HashTagLabs India
 * @Team    	      Team HashTag Labs, India
 * @Contributors      Rinki, Ankur, Arun, Akhil, Ajiz, Rahul, Abhishek, Praveen
 * @copyright	      Copyright (c) 2017 onwards - HashTag Labs Private Limited, India
 * @since	          Version 1.0.0 - last released on 07-06-2017
 * @contact           info@hashtaglabs.biz
 * @website           http://www.hashtaglabs.biz
 * @Mobile            +91 9810723836
 * @Skype             contact.praveensharma | abhishar2000
 * @PayPal            http://paypal.me/abhishar
 * @UPI               abhishar@upi
 */ ?>
<?php
class User_model extends CI_Model {

public function __construct() {
parent::__construct();
}

public function Get_employee_code($empcode)
{
$query=$this->db->query("select emp_id from drm_employee where employee_code='$empcode'");
$result=$query->result();
return $result[0]->emp_id;
}

public function login_process_check($user,$pass)
{
$query=$this->db->query("select * from drm_login where user_name='$user' and password='".$pass."'");

$num=$query->result();
return $num;
}

public function check_records($user)
{
$query=$this->db->query("select * from drm_employee where employee_code='$user' or mobile='$user'");
$num=$query->result();
return $num;
}
   
public function add_employee($data, $emp_code)
{
$this->db->insert('drm_employee',$data);
if (!file_exists("uploads/".$emp_code)) {
mkdir("uploads/".$emp_code, 0755);
mkdir("uploads/".$emp_code."/service_book", 0755);
mkdir("uploads/".$emp_code."/leave_report", 0755);
mkdir("uploads/".$emp_code."/apar", 0755);
mkdir("uploads/".$emp_code."/sr", 0755);
}

$myfile = fopen("uploads/".$emp_code."/service_book/index.html", "w") or die("Unable to open file!");
$txt = "You don't have permission to view this file.";
fwrite($myfile, $txt);

fclose($myfile);

$myfile = fopen("uploads/".$emp_code."/leave_report/index.html", "w") or die("Unable to open file!");
$txt = "You don't have permission to view this file.";
fwrite($myfile, $txt);

fclose($myfile);

$myfile = fopen("uploads/".$emp_code."/apar/index.html", "w") or die("Unable to open file!");
$txt = "You don't have permission to view this file.";
fwrite($myfile, $txt);

fclose($myfile);

}
   
public function employeelist()
{
$query=$this->db->query("select * from drm_employee order by emp_id desc");

$rs=$query->result();
return $rs;
}
   
   
   
public function getemployees($id)
{
$query=$this->db->query("select * from drm_employee  where role='$id' order by emp_id desc");
$rs=$query->result();
return $rs;
}

   
   
public function getSBdetail($empid)
{
$query=$this->db->query("select * from employee_service_book where emp_id='$empid' and status!='Inactive' order by pageno asc"); 
$rs=$query->result();
return $rs; 
}
  
  
  
public function getLRdetail($empid)
{
$query=$this->db->query("select * from upload_emp_lr where emp_id='$empid' and status!='Inactive' order by pageno asc"); 
$rs=$query->result();
return $rs; 
}
  
    

public function getApardetail($empid,$session)
{
$query=$this->db->query("select * from upload_apar where emp_id='$empid' and startdate='$session' and status!='Inactive' order by id asc limit 3"); 
$rs=$query->result();
return $rs; 
}
  

public function getSRdetail($empid)
{
$query=$this->db->query("select * from upload_sr where emp_id='$empid' and status!='Inactive' order by pageno asc"); 
$rs=$query->result();
return $rs; 
}

        
public function getsingleemployee($id)
{
$query=$this->db->query("select * from drm_employee where emp_id ='$id'");
$rs=$query->row();
return $rs;
}
   
   
   
public function getval($table,$id,$value,$what)
{
$query=$this->db->query("select * from $table where $id='$value'");
$rs=$query->result();
return $rs[0]->$what;    
}



public function getdocument($table,$id,$value,$what)
{
$query=$this->db->query("select * from $table where $id='$value' order by pageno ASC");
$rs=$query->result();
return $rs;    
}
  
  
   
public function saveservicebook($empid,$newfile_name,$pageno,$version)
{ 
if($version>1)
{
	$this->db->query("update employee_service_book set status='Inactive' where pageno='$pageno' and emp_id='$empid'");
	
}
$query=$this->db->query("insert into employee_service_book (emp_id, filename, pageno,version) values ('$empid','$newfile_name','$pageno','$version')");

return $query;
}

   
      
public function saveemplr($empid,$newfile_name,$pageno,$version)
{
if($version>1)
{
	$this->db->query("update upload_emp_lr set status='Inactive' where pageno='$pageno' and emp_id='$empid'");
}
$query=$this->db->query("insert into upload_emp_lr (emp_id,filename,pageno,version) values ('$empid','$newfile_name','$pageno','$version')"); 
return $query;


}

public function savesr($empid,$newfile_name,$pageno,$version)
{
if($version>1)
{
	$this->db->query("update upload_sr set status='Inactive' where pageno='$pageno' and emp_id='$empid'");
}
$query=$this->db->query("insert into upload_sr (emp_id,filename,pageno,version) values ('$empid','$newfile_name','$pageno','$version')"); 
return $query;


}



public function saveaparreport($empid,$newfile_name,$pageno,$from,$version)
{

if($version>1)
{
	$this->db->query("update upload_apar set status='Inactive' where pageno='$pageno' and emp_id='$empid'");
}
$query=$this->db->query("insert into upload_apar (emp_id,filename,pageno,startdate,version) values ('$empid','$newfile_name','$pageno','$from','$version')"); 

return $query;
}
  
  
  
public function getPagerVersionServiceBook($empid,$pageno)
{
$query=$this->db->query("select * from employee_service_book where emp_id='$empid' and pageno='$pageno'"); 
$rs=$query->result();
return count($rs)+1; 
}
  
  
public function getPagerVersionapar($empid,$pageno,$from)
{
$query=$this->db->query("select * from  upload_apar where emp_id='$empid' and pageno='$pageno' and startdate='$from'"); 
$rs=$query->result();
return count($rs)+1; 
}
  
  public function getPagerVersionleavereport($empid,$pageno)
{
$query=$this->db->query("select * from 	upload_emp_lr where emp_id='$empid' and pageno='$pageno'"); 
$rs=$query->result();
return count($rs)+1; 
}


public function getPagerVersionsr($empid,$pageno)
{
$query=$this->db->query("select * from 	upload_sr where emp_id='$empid' and pageno='$pageno'"); 
$rs=$query->result();
return count($rs)+1; 
}

    
public function del_emp($id)
{
$query=$this->db->query("select * from drm_employee where emp_id='$id'");
$rs=$query->result();
$this->db->query("delete from drm_login where user_name='".$rs[0]->employee_code."'");	
$results=$this->db->query("DELETE FROM `drm_employee` WHERE `emp_id`='$id'");
return $results;


}

		
		
public function UpdateEmployeeByID($data, $empid)
{
$this->db->where('emp_id', $empid);
$results = $this->db->update('drm_employee',$data);
return $results;
}	

public function deleteleavereport($id)
{
	$query=$this->db->query("select * from upload_emp_lr where lr_id='$id'");
	$rs=$query->result();
	unlink("uploads/".$this->User_model->getsingleemployee($rs[0]->emp_id)->employee_code."/leave_report/".$rs[0]->filename);
	$this->db->query("delete from upload_emp_lr where lr_id='$id'");
	
	
}
public function deleteservicebook($id)
{
	
	$query=$this->db->query("select * from employee_service_book where sb_id='$id'");
	$rs=$query->result();
	unlink("uploads/".$this->User_model->getsingleemployee($rs[0]->emp_id)->employee_code."/service_book/".$rs[0]->filename);
	$this->db->query("delete from employee_service_book where sb_id='$id'");
	
	
}

public function deleteapar($id)
{
	$query=$this->db->query("select * from upload_apar where id='$id'");
	$rs=$query->result();
	unlink("uploads/".$this->User_model->getsingleemployee($rs[0]->emp_id)->employee_code."/apar/".$rs[0]->filename);
	
	$this->db->query("delete from upload_apar where id='$id'");
	
}

public function deletesr($id)
{
	$query=$this->db->query("select * from upload_sr where sr_id='$id'");
	$rs=$query->result();
	unlink("uploads/".$this->User_model->getsingleemployee($rs[0]->emp_id)->employee_code."/sr/".$rs[0]->filename);
	
	$this->db->query("delete from upload_sr where sr_id='$id'");
}

public function getalluploadeservicebookid($id)
{
	$sbid=array();
	$query=$this->db->query("select pageno from employee_service_book where emp_id='$id'");
	$rs=$query->result();
	foreach($rs as $rss)
	{
		
		$sbid[]=$rss->pageno;
		
	}
	return implode(",",$sbid);
	
}
public function getalluploadedleavereportid($id)
{
	$sbid=array();
	$query=$this->db->query("select pageno from upload_emp_lr where emp_id='$id'");
	$rs=$query->result();
	foreach($rs as $rss)
	{
		$sbid[]=$rss->pageno;
	}
	return implode(",",$sbid);
	
}

public function getalluploadedsrid($id)
{
	$sbid=array();
	$query=$this->db->query("select pageno from upload_sr where emp_id='$id'");
	$rs=$query->result();
	foreach($rs as $rss)
	{
		
		$sbid[]=$rss->pageno;
		
	}
	return implode(",",$sbid);
	
}

public function getalluploadedaparid($id)
{
	$sbid=array();
	$query=$this->db->query("select startdate,pageno from upload_apar where emp_id='$id'");
	$rs=$query->result();
	foreach($rs as $rss)
	{
		
		$sbid[]=$rss->pageno."~".$rss->startdate;
	}
	return implode(",",$sbid);
	
}


public function getallsessions($empid)
{
	$query=$this->db->query("select startdate from upload_apar where emp_id='$empid' group by startdate");
	$rs=$query->result();
	return $rs;
	
}




public function getallservicebook($id)
{
	$query=$this->db->query("select * from 	employee_service_book where status!='Inactive' and emp_id='$id' order by pageno asc");

	$rs=$query->result();
	return $rs;
	
	
	
}

public function getallleavereport($id)
{
	$query=$this->db->query("select * from 	upload_emp_lr  where status!='Inactive' and emp_id='$id' order by pageno asc");
	$rs=$query->result();
	return $rs;
	
	
	
}



public function makeLogin($role,$email,$password)
{
     
	
	 $query=$this->db->query("insert into drm_login(user_name,password,role) values ('$email','".md5($password)."','$role')");	
	
	
}

public function getdepartments()
{
	$query=$this->db->query("select * from emp_department where status=1 order by name asc");
	$rs=$query->result();
	return $rs;
}

public function getdesignations()
{
	$query=$this->db->query("select * from emp_designation where status=1 order by name asc");
	$rs=$query->result();
	return $rs;
}

public function get_sb_report_log($empid, $doctype)
{
	if($doctype == 'SB') {
		$query=$this->db->query("select * from employee_service_book where emp_id='$empid' and status!='inactive' order by pageno");
	}

	if($doctype == 'LR') {
		$query=$this->db->query("select * from upload_emp_lr where emp_id='$empid' and status!='inactive' order by pageno");
	}

	if($doctype == 'APAR') {
		$query=$this->db->query("select * from upload_apar where emp_id='$empid' and status!='inactive' order by pageno");
	}

	if($doctype == 'SR') {
		$query=$this->db->query("select * from upload_sr where emp_id='$empid' and status!='inactive' order by pageno");
	}
	
	$rs=$query->result();
	return $rs;
}

public function get_inactive($emp_id, $pageno, $doctype)
{
	switch ($doctype) {
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
}

	if($doctype == 'SB') {
		$query=$this->db->query("select * from $table where emp_id='$emp_id' and pageno='$pageno' and status='inactive'");
	}

	if($doctype == 'LR') {
		$query=$this->db->query("select * from $table where emp_id='$emp_id' and pageno='$pageno' and status!='inactive'");
	}

	if($doctype == 'APAR') {
		$query=$this->db->query("select * from $table where emp_id='$emp_id' and pageno='$pageno' and status!='inactive'");
	}

	if($doctype == 'SR') {
		$query=$this->db->query("select * from $table where emp_id='$emp_id' and pageno='$pageno' and status!='inactive'");
	}
	
	$rs=$query->result();
	return $rs;
}

public function get_table_id($type, $sb)
{
	switch ($type) {
    case 'SB':
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
        break;
	}

	return $id;
}

public function search_employee($search)
{
	$query = $this->db->select('*')->from('drm_employee')
       ->where("employee_name LIKE '%$search%' or employee_code LIKE '%$search%'")->get();
	$rs=$query->result();
	return $rs;
}

public function get_pdf_title($type)
{
	switch ($type) {
    case 'SB':
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
        break;
	}

	return $title;
}

public function get_verification_id($emp_id, $type) 
		{
			$result = $this->db->get_where('verification', array('emp_id'=>$emp_id, 'doc_type'=>$type))->row();
			if(count($result) > 0) {
				return $result->id;
			}
		}

public function add_verification($data)
{
	$result = $this->db->insert('verification',$data);
	return $result;
}

public function update_verification($data, $id)
{
	$this->db->where('id',$id);
	$result = $this->db->update('verification',$data);		
	return $result;
}
	

} ?>