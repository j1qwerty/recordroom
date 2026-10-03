<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Welcome extends CI_Controller {

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
	public function index()
	{
		
		
		$this->load->view('welcome_message');
	}
	
	
	public function getusers()
	{
		$json_array_pitch=array();
		$users=$this->Ang_model->getUsers();
	
			foreach ($users as $pd)
			{
			$json_array_pitch[] = array(
			'id' => $pd['id'],
			'book_name' => $pd['book_name'],
			'book_author' => $pd['book_author'],
			'book_price' => $pd['book_price'],
			'book_language' => $pd['book_language']);
            }
		
		
		$json= json_encode($json_array_pitch, TRUE);
		echo $json;
	}
	
	public function insert()
	{
			$_POST = json_decode(file_get_contents('php://input'), true);
		    $id=$_POST['id'];
			$bname = $_POST['bname'];
			$bauthor = $_POST['bauthor'];
			$bprice = $_POST['bprice'];
			$blanguage = $_POST['blanguage'];
			
			if($id!='')
			{
				$data2=array(
			"book_name"=>$bname,
			"book_author"=>$bauthor,
			"book_price"=>$bprice,
			"book_language"=>$blanguage
			
			);
			$this->Ang_model->update($data2,$id);
				
			}
			else
			{
			$data2=array(
			"book_name"=>$bname,
			"book_author"=>$bauthor,
			"book_price"=>$bprice,
			"book_language"=>$blanguage
			
			);
			
			$this->Ang_model->insert($data2);
			}
		
	}
	
	
	public function deletebook()
	{
			$_POST = json_decode(file_get_contents('php://input'), true);
		
		$this->Ang_model->deletebook($_POST['id']);
	}
}
