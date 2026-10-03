<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

class Fpdf_test extends CI_Controller {

	/**
	 * Example: FPDF 
	 *
	 * Documentation: 
	 * http://www.fpdf.org/ > Manual
	 *
	 */
	const DPI = 96;
    const MM_IN_INCH = 25.4;
    const A4_HEIGHT = 297;
    const A4_WIDTH = 210;
    // tweak these values (in pixels)
    const MAX_WIDTH = 400;
    const MAX_HEIGHT = 500;

    public function pixelsToMM($val) {
        return $val * self::MM_IN_INCH / self::DPI;
    }
    public function resizeToFit($imgFilename) {
        list($width, $height) = getimagesize($imgFilename);
        $widthScale = self::MAX_WIDTH / $width;
        $heightScale = self::MAX_HEIGHT / $height;
        $scale = min($widthScale, $heightScale);
        return array(
            round($this->pixelsToMM($scale * $width)),
            round($this->pixelsToMM($scale * $height))
        );
    }
    public function centreImage($img) {
        
    }

	public function indexss($emp) {	
		$this->load->library('fpdf_gen');
		$emp = explode("-",$emp);
		$empcode = $this->User_model->getsingleemployee($emp[1])->employee_code;
		$empname = $this->User_model->getsingleemployee($emp[1])->employee_name;
		$title = $this->User_model->get_pdf_title($emp[0]);
		$this->fpdf->SetFont('Arial','B',16);
		$this->fpdf->Cell(0,10,$title,1,0);
		foreach($this->User_model->getallservicebook($emp[1]) as $sb) {
			
		$image1 = base_url().'uploads/'.$empcode.'/service_book/'.$sb->filename;
		$this->fpdf->Image($image1,30, 50, 150, 200);
		
			}
		
		echo $this->fpdf->Output('hello_world.pdf','D');
	}

	public function generate_pdf($emp) {

		$this->load->library('fpdf_gen');
		$pdf = new FPDF('P','mm');
    	$pdf->AddPage('P'); 

		$emp = explode("_",$emp);
		$empcode = $this->User_model->getsingleemployee($emp[1])->employee_code;
		$empname = $this->User_model->getsingleemployee($emp[1])->employee_name;
		$title = $this->User_model->get_pdf_title($emp[0]);

    	//$pdf->SetDisplayMode(real,'default');
    	$pdf->SetFont('Arial','B',16);
		$pdf->Cell(50,60,$title);
		$pdf->SetFont('Arial','B',14);
		$pdf->Cell(50,60,$empname);
		$pdf->SetFont('Arial','B',14);
		$pdf->Cell(50,70,$empcode);

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
        $img = base_url().'uploads/'.$empcode.'/'.$folder.'/'.$sb->filename;
		//$pdf->Image($image1);
		//list($width, $height) = $this->resizeToFit($img);

        // you will probably want to swap the width/height
        // around depending on the page's orientation
        // $pdf->Image(
        //     $img, (self::A4_HEIGHT - $width) / 2,
        //     (self::A4_WIDTH - $height) / 2,
        //     $width,
        //     $height
        // 	);
		//$this->centreImage($image1);
		$pdf->Image($img, 10, 10, 185, 275);
        
    	}
    	echo $pdf->Output($emp[0].'-'.$empcode.'.pdf','D');
	}
	
}
