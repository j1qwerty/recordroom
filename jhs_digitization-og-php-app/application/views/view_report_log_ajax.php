    
<table class="table table-striped table-hover" id="example1">
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
        
                
<tbody id="tableData">
<?php 
//echo '<pre>';print_r($sb_log);exit;
$i=1;
foreach($sb_log as $sb)
{ ?>
<tr id="r2">
<td><?php echo $i++; ?></td>
<td><?php echo $sb->filename ?></td>
<td><?php echo $sb->pageno ?></td>
<td><?php echo $sb->version ?></td>
<td><?php echo date('d M Y', strtotime($sb->uploaded_at)); ?></td>
<?php if($_POST['typ'] == 'FILE'){?>
<td><a class="btn btn-primary btn-sm" href="<?php echo base_url();?>uploads/<?php echo $sb->file_barcode;?>/files/<?php echo $sb->filename;?>" target="_blank">Download(<?php  echo count($this->User_model->get_inactive($sb->file_barcode, $sb->pageno, $type));?>)</a></td>
<?php }else{ ?>
<td>
    <a href="javascript:;" class="btn btn-primary btn-sm" data-toggle="modal" data-target="#logModal<?php $tbl_id = $this->User_model->get_table_id($type, $sb); echo $tbl_id; ?>" ><span class="glyphicon glyphicon-eye-open"></span> View Version(<?php  $inactives = $this->User_model->get_inactive($sb->file_barcode, $sb->pageno, $type); echo count($inactives); ?>)</a>

  <div class="modal fade" id="logModal<?php echo $tbl_id; ?>" role="dialog">
    <div class="modal-dialog">
      <!-- Modal content-->
      <div class="modal-content">
        <div class="modal-header">
          <button type="button" class="close" data-dismiss="modal" style="position: relative; right: 10px; color: #000000;">&times;</button>
          <h4 class="modal-title" style="margin:0; font-weight: 600;">Log Files</h4>
        </div>
        <div class="modal-body" id="logModal<?php switch($type) {
           /* case 'SB':
                echo $sb->sb_id;
                $folder = 'service_book';
                break;
            case 'LR':
                echo $sb->lr_id;
                $folder = 'leave_report';
                break;
            case 'APAR':
                echo $sb->id;
                $folder = 'apar';
                break;
            case 'SR':
                echo $sb->sr_id;
                $folder = 'sr';
                break;*/
            case 'FILE':
                echo $sb->file_id;
                $folder = 'files';
                break;
            case 'MAP':
                echo $sb->map_id;
                $folder = 'map';
                break;
        } ?>">

          <div class="container">

            <div class="row">
<div class="col-sm-6">
      <h2>Current Version</h2>  
  <div id="myCarousel" class="carousel slide" data-ride="carousel">

    <!-- Wrapper for slides -->
    <div class="carousel-inner">
      <div class="item active">
        <img src="<?php echo base_url().'uploads/'.$sb->file_barcode.'/'.$folder.'/'.$sb->filename ?>" style="width:100%;">
         <p>File Name: <?php echo $sb->filename; ?></p>
        <p>Last Updated on: <?php echo date('d-m-Y H:i:s', strtotime($sb->uploaded_at)); ?></p>
      </div>
    </div>

  </div>
</div>
<div class="col-sm-6">
  <h2>Previous Versions</h2>  
  <div id="myCarousel<?php echo $tbl_id; ?>" class="carousel slide" data-ride="carousel">

    <!-- Wrapper for slides -->
    <div class="carousel-inner">
      <?php
            $k=1;
            foreach($inactives as $inactive) { 
          ?>
      <div class="item <?php if($k == 1) { echo 'active'; } ?>">
        <img src="<?php echo base_url().'uploads/'.$sb->file_barcode.'/'.$folder.'/'.$inactive->filename ?>" style="width:100%;">
       <p>File Name: <?php echo $inactive->filename; ?></p>
        <p>Last Updated on: <?php echo date('d-m-Y H:i:s', strtotime($inactive->uploaded_at)); ?></p>
      </div>

      <?php $k++; } ?>
    </div>

    <!-- Left and right controls -->
    <a class="left carousel-control" href="#myCarousel<?php echo $tbl_id; ?>" data-slide="prev">
      <span class="glyphicon glyphicon-chevron-left"></span>
      <span class="sr-only">Previous</span>
    </a>
    <a class="right carousel-control" href="#myCarousel<?php echo $tbl_id; ?>" data-slide="next">
      <span class="glyphicon glyphicon-chevron-right"></span>
      <span class="sr-only">Next</span>
    </a>
  </div>
</div>
</div>
            </div>

      </div>


        <div class="modal-footer" style="text-align: center;">
            <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
        </div>
      </div>
      
    </div>
  </div>
  <!-- modal end -->
</td>
<?php }?>
</tr><?php } ?></tbody></table>
<script>
    $(document).ready(function() {
    $('#example1').DataTable( {
       "order": [[ 0, "asc" ]],
       "searching": false,
       "sorting": false,
       "bFilter": false,
            "bSort": false,
            "bLengthChange": false
      });
    });
</script>