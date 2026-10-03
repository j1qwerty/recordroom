<!DOCTYPE html>
<html lang="en">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <!-- Meta, title, CSS, favicons, etc. -->
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <title>JHS Digitization</title>
   
    <!-- Bootstrap -->
    <link href="<?php echo base_url();?>vendors/bootstrap/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Font Awesome -->
    <link href="<?php echo base_url();?>vendors/font-awesome/css/font-awesome.min.css" rel="stylesheet">
    <!-- NProgress -->
    <link href="<?php echo base_url();?>vendors/nprogress/nprogress.css" rel="stylesheet">
        <script src="<?php echo base_url();?>vendors/jquery/dist/jquery.min.js"></script>
    <!-- Custom Theme Style -->
    <link href="<?php echo base_url();?>css/custom.min.css" rel="stylesheet">
	

  </head>

  <body class="nav-md">
    <div class="container body">
      <div class="main_container">

  <style>

  .nav-md .container.body .right_col {
    margin-left: 0px;
}

  p.updatedon {
    font-size: 10px;
}

.falanae .item.form-group {
    float: left;
    width: 33.3%;
    padding: 0 15px;
    min-height: 80px;
    margin: 0;
}

.carousel-inner > .item > img {
    margin: 0 auto;
}

img.imghere {
    object-fit: cover;
    height: 400px !important;
    overflow: hidden;
}
.carousel-control.left, .carousel-control.right {
	background:none;
}
#myCarousel {
	width: 70%;
    margin: 0 auto;
}

</style>      
<div class="right_col">
<div class=""><!-- <div class="page-title"><div class="title_left">
<h3>View Reports</h3>
</div></div> 
<div class="clearfix"></div>-->
<?php
        if($this->session->flashdata('item') != '') {
          $message = $this->session->flashdata('item');
          ?>
        <div class="alert alert-<?php echo $message['class'] ?>"><?php echo $message['message']; ?> </div>
        <?php
        }
        ?>
<div class="row">
<div>

  <!-- Nav tabs -->
  <ul class="nav nav-tabs" role="tablist">
    <li role="presentation" class="active"><a href="#sb" aria-controls="home" role="tab" data-toggle="tab">Service Book</a></li>
        <li role="presentation"><a href="#sr" aria-controls="settings" role="tab" data-toggle="tab">SR Attachment</a></li>
    <li role="presentation"><a href="#lr" aria-controls="profile" role="tab" data-toggle="tab">Leave Report</a></li>
<!--     <li role="presentation"><a href="#apar" aria-controls="messages" role="tab" data-toggle="tab">APAR</a></li> -->

  </ul>

  <!-- Tab panes -->
  <div class="tab-content">
    <div role="tabpanel" class="tab-pane active" id="sb">
    	<div class="x_panel">
<div class="x_title">
<h6>View Service book of <span class="nameheading"><?php echo $this->User_model->getval("drm_employee","emp_id",$this->uri->segment(3),'employee_name'); ?></span></h6>
<ul class="nav navbar-right panel_toolbox">
<li><h6 class="text-right">No. of pages - <?php echo count($this->User_model->getallservicebook($this->uri->segment(3))); ?></h6>

</li>                      
</ul>

<div class="clearfix"></div>
</div>
<?php
//foreach($this->User_model->getallservicebook($this->uri->segment(3)) as $sb) {
	//$images[] = base_url().'uploads/'.$this->User_model->getsingleemployee($this->uri->segment(3))->employee_code.'/service_book/'.$sb->filename;
//}	
 //$images = array("file1.jpg", "file2.jpg");

//$pdf = new Imagick($images);
//$pdf->setImageFormat('pdf');
//$pdf->writeImages('combined.pdf', true); 

?>
<div class="x-content">
  <div class="col-md-12 col-sm-12 col-xs-12">
<div class='list-group gallery' style="width:100%">
 
<?php if(count($this->User_model->getallservicebook($this->uri->segment(3)))>=1) { ?>
<a href="<?php echo base_url(); ?>user/generate_pdf/<?php echo 'SB_'.$this->uri->segment(3); ?>" class="btn btn-info">Save as PDF</a>
<!--   <h2>Carousel Example</h2> -->
  <div id="sbCarousel" class="carousel slide" data-ride="carousel">
    <!-- Indicators -->
    <ol class="carousel-indicators">
    	<?php $k=0; foreach($this->User_model->getallservicebook($this->uri->segment(3)) as $sb)
					{ ?>
      <li data-target="#sbCarousel" data-slide-to="<?php echo $k; ?>" <?php if($k==0) { ?> class="active" <?php } ?>></li>
     
      <?php $k++; } ?>
    </ol>

    <!-- Wrapper for slides -->
    <div class="carousel-inner">
    	<?php $j=1; foreach($this->User_model->getallservicebook($this->uri->segment(3)) as $sb)
					{ ?>
      <div class="item <?php if($j==1) { echo 'active'; } ?>">
        <!-- <img src="la.jpg" alt="Los Angeles" style="width:100%;"> -->
        <img class="imghere" data-toggle="modal" class="thumb" id="<?php echo $sb->sb_id?>" data-target="#myModal" src="<?php echo base_url();?>uploads/<?php echo $this->User_model->getsingleemployee($this->uri->segment(3))->employee_code; ?>/service_book/<?php echo $sb->filename?>" alt=""/>
        <div class="carousel-caption">
          <h3>Page No: <?php echo $sb->pageno?></h3>
          <!--<p>LA is always so much fun!</p> -->
          <p>Last Updated on :<br> <?php echo date('d-m-Y H:i:s', strtotime($sb->uploaded_at)); ?></p>
        </div>
      </div>
  		<?php $j++; } ?>
    </div>

    <!-- Left and right controls -->
    <a class="left carousel-control" href="#sbCarousel" data-slide="prev">
      <span class="glyphicon glyphicon-chevron-left"></span>
      <span class="sr-only">Previous</span>
    </a>
    <a class="right carousel-control" href="#sbCarousel" data-slide="next">
      <span class="glyphicon glyphicon-chevron-right"></span>
      <span class="sr-only">Next</span>
    </a>
  </div>
		<?php } 
else{?><div class="container">
<div class="col-md-8" style="color: red; margin-top: 100px; text-align: center;">
	Service book is not uploaded!
	</div>
	</div>
<?php }?></div></div>
</div>
        
<!------------------------------ Modal -------------------->
<div class="modal fade" id="myModal" role="dialog">
    <div class="modal-dialog">
    
      <!-- Modal content-->
      <div class="modal-content">
        
      </div>
      
    </div>
  </div> 

        <!-- The JavaScript -->

        <script type="text/javascript">		
			
			$(document).ready(function(){
				$(".thumb").click(function(){
					var empid="<?php echo $this->uri->segment(3);?>";
					var empcd="<?php echo $this->User_model->getsingleemployee($this->uri->segment(3))->employee_code;?>";
					var id=$(this).attr("id");
					 $.get("<?php echo base_url();?>user/getservicebookbyid/"+id+"/"+empid, function(data){
                   $(".modal-content").html("<img style='width:100%' src='<?php echo base_url();?>uploads/"+empcd+"/service_book/"+data+"'>");
    });
					
					
				});
			});
        </script>
</div>
    </div>
    <div role="tabpanel" class="tab-pane" id="lr">

    	<?php $lr = $this->User_model->getLRdetail($this->uri->segment(3)); ?>

<div class="x_panel">
<div class="x_title">
<h6>View Leave Report For <span class="nameheading"><?php echo $this->User_model->getval("drm_employee","emp_id",$this->uri->segment(3),'employee_name'); ?></span></h6>
<ul class="nav navbar-right panel_toolbox">
<li><h6 class="text-right">No. of pages - <?php echo count($lr); ?></h6>

</li>                      
</ul>

<div class="clearfix"></div>
</div>

<div class="x-content">
  <div class="col-md-12 col-sm-12 col-xs-12">
<div class='list-group gallery' style="width:100%">
  <?php if(count($lr)>=1) { ?>
  <a href="<?php echo base_url(); ?>user/generate_pdf/<?php echo 'LR_'.$this->uri->segment(3); ?>" class="btn btn-info">Save as PDF</a>

  <div id="lrCarousel" class="carousel slide" data-ride="carousel">
    <!-- Indicators -->
    <ol class="carousel-indicators">
      <?php $k=0; foreach($lr as $value) { ?>
      <li data-target="#lrCarousel" data-slide-to="<?php echo $k; ?>" <?php if($k==0) { ?> class="active" <?php } ?>></li>
     
      <?php $k++; } ?>
    </ol>

    <!-- Wrapper for slides -->
    <div class="carousel-inner">
      <?php $j=1; foreach($lr as $value) { ?>
      <div class="item <?php if($j==1) { echo 'active'; } ?>">
        <!-- <img src="la.jpg" alt="Los Angeles" style="width:100%;"> -->
        <img class="imghere" data-toggle="modal" class="thumb" id="<?php echo $value->lr_id?>" data-target="#myModal" src="<?php echo base_url();?>uploads/<?php echo $this->User_model->getsingleemployee($this->uri->segment(3))->employee_code; ?>/leave_report/<?php echo $value->filename;?>" alt=""/>
        <div class="carousel-caption">
          <h3>Page No: <?php echo $value->pageno?></h3>
          <!--<p>LA is always so much fun!</p> -->
          <p>Last Updated on :<br> <?php echo date('d-m-Y H:i:s', strtotime($value->uploaded_at)); ?></p>
        </div>
      </div>
      <?php $j++; } ?>
    </div>

    <!-- Left and right controls -->
    <a class="left carousel-control" href="#lrCarousel" data-slide="prev">
      <span class="glyphicon glyphicon-chevron-left"></span>
      <span class="sr-only">Previous</span>
    </a>
    <a class="right carousel-control" href="#lrCarousel" data-slide="next">
      <span class="glyphicon glyphicon-chevron-right"></span>
      <span class="sr-only">Next</span>
    </a>
  </div>


<!-- <div class='col-sm-4 col-xs-6 col-md-3 col-lg-3'  style="width:150px;">
<div class="imgset">
<a class="thumbnail fancybox" rel="ligthbox"  style="height:auto !important"  href="<?php echo base_url();?>uploads/<?php echo $this->User_model->getsingleemployee($this->uri->segment(3))->employee_code; ?>/leave_report/<?php echo $value->filename;?>">
<p><?php echo "Page no".$value->pageno;?></p>                  
<img src="<?php echo base_url();?>uploads/<?php echo $this->User_model->getsingleemployee($this->uri->segment(3))->employee_code; ?>/leave_report/<?php echo $value->filename;?>" title="<?php echo "page no".$value->pageno;?>">
<p class="updatedon">Last Updated on :<br> <?php echo date('d-m-Y H:i:s', strtotime($value->uploaded_at)); ?></p>
</a>


</div></div> -->
<?php }
else
{?><div class="container">
<div class="col-md-8" style="color: red; margin-top: 100px; text-align: center;">
  Leave report is not uploaded!
  </div>
  </div><?php 
}?></div></div>
</div>


</div>
    </div>
    <div role="tabpanel" class="tab-pane" id="apar">

    	<div class="x_panel">
<div class="x_title">
<h6>View Apar Report For <span class="nameheading"><?php echo $this->User_model->getval("drm_employee","emp_id",$this->uri->segment(3),'employee_name'); ?></span></h6>
<ul class="nav navbar-right panel_toolbox">
<li><h6 class="text-right">No. of Sessions - <?php echo count($this->User_model->getallsessions($this->uri->segment(3))); ?></h6>
</li>                      
</ul>

<script>


</script>
<div class="clearfix"></div></div>

<div class="x-content">
    <div class="col-md-12 col-sm-12 col-xs-12">
<div class='list-group gallery' style="width:100%">
<?php if(count($this->User_model->getallsessions($this->uri->segment(3)))>=1)
  { ?>
  <div class="col-sm-2">
  <select class="form-control" id="sessions" name="sessions">
   <?php foreach($this->User_model->getallsessions($this->uri->segment(3)) as $sess)
    { ?>
    <option value="<?php echo $sess->startdate;?>"><?php echo $sess->startdate;?></option>
    <?php } ?>
  </select>
</div>
<a href="" class="btn btn-info" id="Url">Save as PDF</a>
<?php } ?>
<?php if(count($this->User_model->getallsessions($this->uri->segment(3)))>=1)
{
  $i = 1;
  foreach($this->User_model->getallsessions($this->uri->segment(3)) as $sess)
{ ?>

<?php $apar=$this->User_model->getApardetail($this->uri->segment(3),$sess->startdate);?>
<div class="row"><h3>Session:&nbsp <?php echo $sess->startdate;?></h3>


<div id="myCarousel<?php echo $i; ?>" class="carousel slide" data-ride="carousel">
    <!-- Indicators -->
    <ol class="carousel-indicators">
      <?php $k=0; foreach($apar as $value){ ?>
      <li data-target="#myCarousel<?php echo $i; ?>" data-slide-to="<?php echo $k; ?>" <?php if($k==0) { ?> class="active" <?php } ?>></li>
     
      <?php $k++; } ?>
    </ol>

    <!-- Wrapper for slides -->
    <div class="carousel-inner">
      <?php $j=1; foreach($apar as $value){ ?>
      <div class="item <?php if($j==1) { echo 'active'; } ?>">
        <!-- <img src="la.jpg" alt="Los Angeles" style="width:100%;"> -->
        <img class="imghere" data-toggle="modal" class="thumb" id="<?php echo $value->id?>" data-target="#myModal" src="<?php echo base_url();?>uploads/<?php echo $this->User_model->getsingleemployee($this->uri->segment(3))->employee_code; ?>/apar/<?php echo $value->filename;?>" alt=""/>
        <div class="carousel-caption">
          <h3>Page No: <?php echo $value->pageno?></h3>
          <!--<p>LA is always so much fun!</p> -->
          <p>Last Updated on :<br> <?php echo date('d-m-Y H:i:s', strtotime($value->uploaded_at)); ?></p>
        </div>
      </div>
      <?php $j++; } ?>
    </div>

    <!-- Left and right controls -->
    <a class="left carousel-control" href="#myCarousel<?php echo $i; ?>" data-slide="prev">
      <span class="glyphicon glyphicon-chevron-left"></span>
      <span class="sr-only">Previous</span>
    </a>
    <a class="right carousel-control" href="#myCarousel<?php echo $i; ?>" data-slide="next">
      <span class="glyphicon glyphicon-chevron-right"></span>
      <span class="sr-only">Next</span>
    </a>
  </div>


<!-- <div class='col-sm-4 col-xs-6 col-md-3 col-lg-3'  style="width:150px;">
  <div class="imgset">
    <a class="thumbnail fancybox" rel="ligthbox" style="height:auto !important" href="<?php echo base_url();?>uploads/<?php echo $this->User_model->getsingleemployee($this->uri->segment(3))->employee_code; ?>/apar/<?php echo $value->filename;?>">
    
    <p>Page No: <?php echo $value->pageno?></p>                  
    <img src="<?php echo base_url();?>uploads/<?php echo $this->User_model->getsingleemployee($this->uri->segment(3))->employee_code; ?>/apar/<?php echo $value->filename;?>" title="Session:&nbsp <?php echo $value->startdate;?>">
    <p class="updatedon">Last Updated on :<br> <?php echo date('d-m-Y H:i:s', strtotime($value->uploaded_at)); ?></p> 
    </a>
    
  </div>
</div> -->
</div>
<?php $i++; } ?>

<?php }
else
{?><div class="container">
<div class="col-md-8" style="color: red; margin-top: 100px; text-align: center;">
  APAR Report is not uploaded!
  </div>
  </div><?php 
}?>
</div></div>
</div>


</div>

    </div>
    <div role="tabpanel" class="tab-pane" id="sr">
    	<?php $sr = $this->User_model->getSRdetail($this->uri->segment(3)); ?>
    	<div class="x_panel">
<div class="x_title">
<h6>View SR Attachment For <span class="nameheading"><?php echo $this->User_model->getval("drm_employee","emp_id",$this->uri->segment(3),'employee_name'); ?></span></h6>
<ul class="nav navbar-right panel_toolbox">
<li><h6 class="text-right">No. of pages - <?php echo count($sr); ?></h6>
</li>                      
</ul>
<div class="clearfix"></div>
</div>


<div class="x-content">
    <div class="col-md-12 col-sm-12 col-xs-12">
<div class='list-group gallery' style="width:100%">
<?php if(count($sr)>=1) { ?>
<a href="<?php echo base_url(); ?>user/generate_pdf/<?php echo 'SR_'.$this->uri->segment(3); ?>" class="btn btn-info">Save as PDF</a>

<div id="srCarousel" class="carousel slide" data-ride="carousel">
    <!-- Indicators -->
    <ol class="carousel-indicators">
      <?php $k=0; foreach($sr as $value) { ?>
      <li data-target="#srCarousel" data-slide-to="<?php echo $k; ?>" <?php if($k==0) { ?> class="active" <?php } ?>></li>
     
      <?php $k++; } ?>
    </ol>

    <!-- Wrapper for slides -->
    <div class="carousel-inner">
      <?php $j=1; foreach($sr as $value) { ?>
      <div class="item <?php if($j==1) { echo 'active'; } ?>">
        <!-- <img src="la.jpg" alt="Los Angeles" style="width:100%;"> -->
        <img class="imghere" data-toggle="modal" class="thumb" id="<?php echo $value->sr_id?>" data-target="#myModal" src="<?php echo base_url();?>uploads/<?php echo $this->User_model->getsingleemployee($this->uri->segment(3))->employee_code; ?>/sr/<?php echo $value->filename;?>" alt=""/>
        <div class="carousel-caption">
          <h3>Page No: <?php echo $value->pageno ?></h3>
          <!--<p>LA is always so much fun!</p> -->
          <p>Last Updated on :<br> <?php echo date('d-m-Y H:i:s', strtotime($value->uploaded_at)); ?></p>
        </div>
      </div>
      <?php $j++; } ?>
    </div>

    <!-- Left and right controls -->
    <a class="left carousel-control" href="#srCarousel" data-slide="prev">
      <span class="glyphicon glyphicon-chevron-left"></span>
      <span class="sr-only">Previous</span>
    </a>
    <a class="right carousel-control" href="#srCarousel" data-slide="next">
      <span class="glyphicon glyphicon-chevron-right"></span>
      <span class="sr-only">Next</span>
    </a>
  </div>



<!-- <div class='col-sm-4 col-xs-6 col-md-3 col-lg-3'  style="width:150px;">
<div class="imgset">
<a class="thumbnail fancybox" rel="ligthbox"  style="height:auto !important"  href="<?php echo base_url();?>uploads/<?php echo $this->User_model->getsingleemployee($this->uri->segment(3))->employee_code; ?>/sr/<?php echo $value->filename;?>">
<p><?php echo "Page no".$value->pageno;?></p>                  
<img src="<?php echo base_url();?>uploads/<?php echo $this->User_model->getsingleemployee($this->uri->segment(3))->employee_code; ?>/sr/<?php echo $value->filename;?>" title="<?php echo "page no".$value->pageno;?>">
<p class="updatedon">Last Updated on :<br> <?php echo date('d-m-Y H:i:s', strtotime($value->uploaded_at)); ?></p>
</a>


</div></div> -->
<?php } else { ?>
<div class="container">
<div class="col-md-8" style="color: red; margin-top: 100px; text-align: center;">
    SR Attachment is not uploaded!
    </div>
    </div><?php 
}?></div></div>


</div>

</div>

    </div>
  </div>

</div>


</div></div></div>

      </div>
    </div>

    <!-- jQuery -->

    <!-- Bootstrap -->
    <script src="<?php echo base_url();?>vendors/bootstrap/dist/js/bootstrap.min.js"></script>
    <!-- FastClick -->
    <script src="<?php echo base_url();?>vendors/fastclick/lib/fastclick.js"></script>
    <!-- NProgress -->
    <script src="<?php echo base_url();?>vendors/nprogress/nprogress.js"></script>
    <!-- validator -->
<?php /*?>    <script src="<?php echo base_url();?>vendors/validator/validator.js"></script><?php */?>

    <!-- Custom Theme Scripts -->
    <script src="<?php echo base_url();?>js/custom.min.js"></script>

<script>
    $('#sessions').change(function(){
    var sess = $(this).val();
    setURL(sess);
  	});

  	window.onload = function() {
   var sess = $('select[name=sessions]').val();
   setURL(sess);
  }

  	 function setURL(sess) {
    var url = "<?php echo base_url(); ?>user/generate_pdf/APAR_<?php echo $this->uri->segment(3); ?>_" + sess;
    $('#Url').attr('href', url);
  }
    </script>
	
  </body>
</html>