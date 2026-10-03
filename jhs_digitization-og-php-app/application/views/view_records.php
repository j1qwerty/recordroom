<script src="<?php echo base_url(); ?>js/dataTables.min.js"></script>
<script src="<?php echo base_url(); ?>js/dataTables.min.js"></script>
<script src="<?php echo base_url(); ?>js/dataTables.bootstrap.min.js"></script>
<link rel="stylesheet" href="<?php echo base_url(); ?>css/dataTables.bootstrap.min.css">
<style>
.error{
	 color:red;
	 font-weight:bold;
	 
 }
 .item  p{
	 margin:0px;
	 color:red;
 }

 .btn-sm {
    padding: 5px 5px;
    font-size: 11px;
}

</style>
<div class="right_col">
          <div class="">
            <div class="page-title">
              <div class="title_left">
                <h3><?php switch ($this->uri->segment(3)) {
              		case 'sb':
              			echo 'Service Record';
              			break;
              		case 'lr':
              			echo 'Leave Record';
              			break;
              		case 'sr':
              			echo 'SR Attachment';
              			break; 
              		case 'apar':
              			echo 'APAR';
              			break;               		
              		} ?></h3>
              </div>
              <div style="float:right;">
              <a class="btn btn-primary" href="javascript:void(0);" onClick="history.back();">Back</a>
          </div>
          </div>

<div class="clearfix"></div>
<?php
 if($this->session->flashdata('item') != '') {
           $message = $this->session->flashdata('item');
           ?>
 <div class="alert alert-<?php echo $message['class'] ?>"><?php echo $message['message']; 

		
		?> </div>
        <?php
        }?>
        <div class="row">
<div class="col-md-12 col-sm-12 col-xs-12">
	
<div class="" style="margin-top:20px">
				 
<div class="bs-component" ng-controller="listdata">
				
				<table class="table table-striped table-hover" id="example">
					<thead>
						<tr>
							<th>#</th>
							<th width="15%">Employee Code</th>
                            <th width="15%">Employee Name</th>
                            <th>Gender</th>
                            <th>Mobile</th>
                            <th>View</th>
                            <?php if($this->session->userdata("user_type")!='Verifier') { ?>
                            <th>Upload</th>
                            <?php } ?>
			           </tr>
                   </thead>
				
                
<tbody>
<?php $i=1;
if(!empty($employee)) {
foreach($employee as $emp) { ?>
<tr id="r2">
<td><?php echo $i++;?></td>
<td><?php echo $emp->employee_code?></td>
<td><?php echo $emp->employee_name?></td>
<td><?php if($emp->gender == 'M') { echo 'Male'; } elseif($emp->gender == 'F') { echo 'Female'; } else { echo $emp->gender; } ?></td>
<td><?php echo $emp->mobile?></td>
<td>
		
		<a class="btn btn-primary btn-sm" href="<?php echo base_url();?>user/viewservicebook/<?php echo $emp->emp_id?>"><span class="glyphicon glyphicon-eye-open"></span> SB (<?php echo count($this->User_model->getallservicebook($emp->emp_id)); ?>)</a>
		<a class="btn btn-primary btn-sm" href="<?php echo base_url();?>user/viewleavereports/<?php echo $emp->emp_id?>"><span class="glyphicon glyphicon-eye-open"></span> LR (<?php $lr=$this->User_model->getLRdetail($emp->emp_id); echo count($lr); ?>)</a>
		<a class="btn btn-primary btn-sm" href="<?php echo base_url();?>user/viewapar/<?php echo $emp->emp_id?>"><span class="glyphicon glyphicon-eye-open"></span> APAR (<?php echo count($this->User_model->getallsessions($emp->emp_id)); ?>)</a>

		<a class="btn btn-primary btn-sm" href="<?php echo base_url();?>user/viewsr/<?php echo $emp->emp_id?>"><span class="glyphicon glyphicon-eye-open"></span> Attachments (<?php echo count($this->User_model->getSRdetail($emp->emp_id)); ?>)</a>
		
		<a class="btn btn-primary btn-sm" href="<?php echo base_url();?>user/view_report_log/<?php echo $emp->emp_id?>"><span class="glyphicon glyphicon-eye-open"></span> Report Log </a>
		<a class="btn btn-primary btn-sm" href="<?php echo base_url();?>user/view_sr_book/<?php echo $emp->emp_id?>"><span class="glyphicon glyphicon-eye-open"></span> Book View (<?php echo count($this->User_model->getallservicebook($emp->emp_id)); ?>)</a>
		
</td>

<?php if($this->session->userdata("user_type")!='Verifier') { ?>
<td> 

<a class="btn btn-success btn-sm" href="<?php echo base_url();?>user/uploadservices/<?php echo $emp->emp_id?>"><span class="glyphicon glyphicon-cloud-upload"></span> SB</a>


<a class="btn btn-success btn-sm" href="<?php echo base_url();?>user/upload_emp_lr/<?php echo $emp->emp_id?>"><span class="glyphicon glyphicon-cloud-upload"></span> LR</a>

<a class="btn btn-success btn-sm" href="<?php echo base_url();?>user/upload_apar/<?php echo $emp->emp_id?>"><span class="glyphicon glyphicon-cloud-upload"></span> APAR</a>

<a class="btn btn-success btn-sm" href="<?php echo base_url();?>user/upload_sr/<?php echo $emp->emp_id?>"><span class="glyphicon glyphicon-cloud-upload"></span> Attachments</a>
</td>

<?php } ?>

</tr><?php } ?> 

<script>
		$(document).ready(function() {
    $('#example').DataTable( {
       "order": [[ 0, "asc" ]],
       "sorting": false,
       "bLengthChange": false,
       "searching":false
    } );
} );
</script>
<?php } ?>
</tbody></table>
</div></div></div>
            </div>
          </div>
        </div>
		
	

		




