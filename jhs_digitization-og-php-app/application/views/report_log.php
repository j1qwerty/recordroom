<script src="<?php echo base_url(); ?>js/dataTables.min.js"></script>
<script src="<?php echo base_url(); ?>js/dataTables.min.js"></script>
<script src="<?php echo base_url(); ?>js/dataTables.bootstrap.min.js"></script>
<link rel="stylesheet" href="<?php echo base_url(); ?>css/dataTables.bootstrap.min.css">
<style>
.page-title .title_right {
    width: 20%;
    float: right;
    display: block;
}

.modal-dialog {
  width: 1000px;
}

img.imghere {
    object-fit: cover;
    height: 400px !important;
    overflow: hidden;
}

.carousel-control.left, .carousel-control.right {
  background:none;
}

</style>
<div class="right_col">

          <div class="">
            <div class="page-title">
              <div class="title_left">
<!--                <h3>Report Log (<span id="doc">Service Record</span>)-->
                  <h3>Report Log (<span id="doc">Files</span>)
                </h3>
              </div>
               <div class="title_right">
              <select id="docType" name="doc_type" class="form-control"> 
<!--                <option value="SB">Service Record</option>
                <option value="LR">Leave Record</option>                
                <option value="SR">SR Attachment</option>
                <option value="APAR">APAR</option>-->
                <option value="FILE">FILE</option>
                <option value="MAP">MAP</option>
              </select>
            </div>
                <input type="hidden" name="file_barcode" id="file_barcode" value="<?php echo $this->uri->segment(3);?>">
            <div class="title_left">
                <h4>File Name : <?php echo $this->File_model->getsinglefile($this->uri->segment(3))->file_name;?></h4>
                <h4>File Barcode : <?php echo $this->uri->segment(3);?></h4>
              </div>
          </div>

<div class="clearfix"></div>
<?php
 if($this->session->flashdata('item') != '') {
           $message = $this->session->flashdata('item');
           ?>
        <div class="alert alert-<?php echo $message['class'] ?>"><?php echo $message['message']; ?></div>
        <?php
        }?>
<div class="row">
    <div class="col-md-12 col-sm-12 col-xs-12">
        <div class="">
            <div class="bs-component" ng-controller="listdata">
		<table class="table table-striped table-hover" id="example">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>File Name</th>
                            <th>Page No.</th>
                            <th>Version</th>
                            <th>Date</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                    <?php $i=1;
                    foreach($sb_log as $sb)
                    { ?>
                    <tr id="r2">
                    <td><?php echo $i++; ?></td>
                    <td><?php echo $sb->filename ?></td>
                    <td><?php echo $sb->pageno ?></td>
                    <td><?php echo $sb->version ?></td>
                    <td><?php echo date('d M Y', strtotime($sb->uploaded_at)); ?></td>
                    <td>
                        <a class="btn btn-primary btn-sm" href="<?php echo base_url();?>uploads/<?php echo $this->uri->segment(3);?>/files/<?php echo $sb->filename;?>" target="_blank">Download(<?php  $inactives = $this->User_model->get_inactive($sb->file_barcode, $sb->pageno, 'FILE'); echo count($inactives); ?>)</a>
                        <!--<a href="javascript:;" class="btn btn-primary btn-sm" data-toggle="modal" data-target="#logModal<?php // echo $sb->file_id; ?>" ><span class="glyphicon glyphicon-eye-open"></span> View Version(<?php //  $inactives = $this->User_model->get_inactive($sb->emp_id, $sb->pageno, 'FILE'); echo count($inactives); ?>)</a>-->
                    </td>    
<!--		<a href="javascript:;" class="btn btn-primary btn-sm" data-toggle="modal" data-target="#logModal<?php echo $sb->sb_id; ?>" ><span class="glyphicon glyphicon-eye-open"></span> View Version(<?php //  $inactives = $this->User_model->get_inactive($sb->emp_id, $sb->pageno, 'SB'); echo count($inactives); ?>)</a>-->
<!--<a href="javascript:;" class="btn btn-primary btn-sm" data-toggle="modal" data-target="#logModal<?php echo $sb->file_id; ?>" ><span class="glyphicon glyphicon-eye-open"></span> View Version(<?php //  $inactives = $this->User_model->get_inactive($sb->emp_id, $sb->pageno, 'FILE'); echo count($inactives); ?>)</a>-->
  <!--<div class="modal fade" id="logModal<?php echo $sb->sb_id; ?>" role="dialog">-->
<!--<div class="modal fade" id="logModal<?php echo $sb->file_id; ?>" role="dialog">
    <div class="modal-dialog">-->
      <!-- Modal content-->
<!--      <div class="modal-content">
        <div class="modal-header">
          <button type="button" class="close" data-dismiss="modal" style="position: relative; right: 10px; color: #000000;">&times;</button>
          <h4 class="modal-title" style="margin:0; font-weight: 600;">Log Files</h4>
        </div>-->
        <!--<div class="modal-body" id="logModal<?php // echo $sb->sb_id ?>">-->
<!--            <div class="modal-body" id="logModal<?php // echo $sb->file_id ?>">
          
                    <div class="container">-->

<!--            <div class="row">
<div class="col-sm-6">
      <h2>Current Version</h2>  
  <div id="myCarousel" class="carousel slide" data-ride="carousel">-->

    <!-- Wrapper for slides -->
<!--    <div class="carousel-inner">
      <div class="item active">-->
<!--        <img class="imghere" src="<?php // echo base_url().'uploads/'.$this->User_model->getsingleemployee($sb->emp_id)->employee_code.'/service_book/'.$sb->filename ?>" alt="Los Angeles" style="width:100%;">-->
<!--          <img class="imghere" src="<?php // echo base_url().'uploads/'.$this->User_model->getsingleemployee($sb->emp_id)->employee_code.'/files/'.$sb->filename ?>" alt="Los Angeles" style="width:100%;">
        <p>File Name: <?php // echo $sb->filename; ?></p>
        <p>Last Updated on: <?php // echo date('d-m-Y H:i:s', strtotime($sb->uploaded_at)); ?></p>
      </div>
    </div>

  </div>
</div>
<div class="col-sm-6">
  <h2>Previous Versions</h2>  -->
  <!--<div id="myCarousel<?php // echo $sb->sb_id ?>" class="carousel slide" data-ride="carousel">-->
  <!--<div id="myCarousel<?php // echo $sb->file_id ?>" class="carousel slide" data-ride="carousel">-->

    <!-- Wrapper for slides -->
    <!--<div class="carousel-inner">-->
      <?php
//            $k=1; 
//            foreach($inactives as $inactive) { 
          ?>
      <!--<div class="item <?php // if($k == 1) { echo 'active'; } ?>">-->
<!--        <img class="imghere" src="<?php // echo base_url().'uploads/'.$this->User_model->getsingleemployee($sb->emp_id)->employee_code.'/service_book/'.$inactive->filename ?>" alt="Los Angeles" style="width:100%;">-->
<!--          <img class="imghere" src="<?php // echo base_url().'uploads/'.$this->User_model->getsingleemployee($sb->emp_id)->employee_code.'/files/'.$inactive->filename ?>" alt="Los Angeles" style="width:100%;">
        <p>File Name: <?php // echo $inactive->filename; ?></p>
        <p>Last Updated on: <?php // echo date('d-m-Y H:i:s', strtotime($inactive->uploaded_at)); ?></p>
      </div>-->
      <?php // $k++; } ?>
    <!--</div>-->

    <!-- Left and right controls -->
    <!--<a class="left carousel-control" href="#myCarousel<?php // echo $sb->sb_id ?>" data-slide="prev">-->
<!--    <a class="left carousel-control" href="#myCarousel<?php // echo $sb->file_id ?>" data-slide="prev">
      <span class="glyphicon glyphicon-chevron-left"></span>
      <span class="sr-only">Previous</span>
    </a>-->
<!--    <a class="right carousel-control" href="#myCarousel<?php // echo $sb->sb_id ?>" data-slide="next">-->
<!--    <a class="right carousel-control" href="#myCarousel<?php // echo $sb->file_id ?>" data-slide="next">
      <span class="glyphicon glyphicon-chevron-right"></span>
      <span class="sr-only">Next</span>
    </a>-->
<!--  </div>
</div>
</div>
            </div>
      </div>


        <div class="modal-footer" style="text-align: center;">
            <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
        </div>
      </div>
      
    </div>
  </div>-->
  <!-- modal end -->
<!--</td>-->
</tr><?php } ?></tbody>
</table> 
</div>
        </div>
    </div>
            
</div>
          
          </div>
        
</div>
		
	
		<script>
		$(document).ready(function() {
    $('#example').DataTable( {
       "order": [[ 0, "asc" ]],
       "searching": false,
       "sorting": false,
       "bFilter": false,
            "bSort": false,
            "bLengthChange": false, 
      });

    $('#docType').change(function(){
      var typ = $(this).val();
      var file_barcode = $('#file_barcode').val();
//      alert(file_barcode);
      $.ajax({
            url : "<?php echo base_url(); ?>user/view_report_log_ajax",
            type : "POST",
            data : {'typ' : typ, 'file_barcode' : file_barcode},
            success : function(data) {
                    $('.bs-component').html(data);
                    var doctype;
//                    if(typ == 'SB') { doctype = 'Service Record'; }
//                    if(typ == 'APAR') { doctype = 'APAR'; }
//                    if(typ == 'LR') { doctype = 'Leave Record'; }
//                    if(typ == 'SR') { doctype = 'SR Attachment'; }
                    if(typ == 'FILE') { doctype = 'Files'; }
                    if(typ == 'MAP') { doctype = 'Map'; }
                    $('#doc').html(doctype);
                   }
              });
      });
  })
</script>
		




