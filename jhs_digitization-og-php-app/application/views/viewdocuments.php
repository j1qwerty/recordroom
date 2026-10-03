 <style>
 .labeltext{
	font-weight:bold 
	 
 }
 .error{
	 color:red;
	 font-weight:bold;
	 
 }
 .imageThumb {
    width: 177px;
    height: auto;
    float: left !important;
    border: 2px solid #eeeeee;
    margin-top: 6px;
}
 .thumbs span {
    font-weight: bold;
    margin-top: 3px;
}
 .thumbs{
	width: 190px;
    float: left;
    border: 1px solid #eeeeee;
    padding: 5px;
    margin: 5px;
    text-align: center; 
 }
 </style>
 <style>

.gallery
{
    display: inline-block;
    margin-top: 20px;
}

a.thumbnail.fancybox img {
    height: 100%;
    width: 100%;
}
.imgset
 {
    float: left;
    min-width: 250px;
    min-height: 250px;
	
}

</style>

<script>
$(document).ready(function(){
    $(".fancybox").fancybox({
        openEffect: "none",
        closeEffect: "none"
    });
});
   
  
  </script>

<link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/fancybox/2.1.5/jquery.fancybox.min.css" media="screen">
<script src="//cdnjs.cloudflare.com/ajax/libs/fancybox/2.1.5/jquery.fancybox.min.js"></script>
 <div class="right_col">
          <div class="">
            <div class="page-title">
              <div class="title_left">
                <h3>View Employee Documents</h3>
              </div>

         
            </div>
            <div class="clearfix"></div>

            <div class="row">
			
            <div class="col-md-12 col-sm-12 col-xs-12">
			  
                <div class="x_panel">
                  <div class="x_title">
                    <h2>Documents For <span class="nameheading"><?php echo $this->User_model->getval("drm_employee","emp_id",$this->uri->segment(3),'employee_name')?></span></h2>
                    <ul class="nav navbar-right panel_toolbox">
                      <li><a class="collapse-link"><i class="fa fa-chevron-up"></i></a>
                      </li>                      
                    </ul>
                    <div class="clearfix"></div>
                  </div>
                  <div class="x_content"><div class="error" ng-bind="error" style="text-align:center"></div>
                    <form method="post" action="<?php echo base_url()?>user/uploadservicebook/<?php echo $this->uri->segment(3)?>" name="employeeform" enctype="multipart/form-data"> 
                    
                      <div class="container">
	<div class="row">
    <div class="col-md-12">
		<div class='list-group gallery' style="width:100%">
            <?php $data=$this->User_model->getdocument("employee_service_book","emp_id",$this->uri->segment(3),'filename');
			if(!empty($data)){
		foreach($data as $val) { ?>
            
            <div class='col-sm-4 col-xs-6 col-md-3 col-lg-3'>
            <div class="imgset">
<a class="thumbnail fancybox" rel="ligthbox" href="<?php echo base_url();?>uploads/<?php echo $this->uri->segment(3);?>/<?php echo $val->filename;?>">
                    
                    <img src="<?php echo base_url();?>uploads/<?php echo $this->uri->segment(3);?>/<?php echo $val->filename;?> ">
                    
                </a>
                </div>
            </div> 
            <?php } }?>
<!-- col-6 / end -->
        </div> <!-- list-group / end -->
        </div>
	</div> <!-- row / end -->
</div>            
                     <?php /*?> <div class="col-md-12 col-sm-12 col-xs-12">
                       <div class="col-md-4 col-sm-4 col-xs-4">
                       <img src="../../images/cropper.jpg" width="100%">
                       </div>
                       
                         <div class="col-md-4 col-sm-4 col-xs-4">
                          <img src="../../images/cropper.jpg" width="100%">
                       </div>
                       
                         <div class="col-md-4 col-sm-4 col-xs-4">
                          <img src="../../images/cropper.jpg" width="100%">
                       </div>
                       
                       <div class="col-md-4 col-sm-4 col-xs-4">
                          <img src="../../images/cropper.jpg" width="100%">
                       </div>
                      </div><?php */?>
                       
                       
                    </form>
                  </div>
                </div>
            </div>
            </div>
          </div>
    </div>

