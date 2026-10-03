<script src="<?php echo base_url(); ?>js/dataTables.min.js"></script>
<script src="<?php echo base_url(); ?>js/dataTables.min.js"></script>
<script src="<?php echo base_url(); ?>js/dataTables.bootstrap.min.js"></script>
<link rel="stylesheet" href="<?php echo base_url(); ?>css/dataTables.bootstrap.min.css">

<div class="right_col">
          <div class="">
            <div class="page-title">
              <div class="title_left">
                <h3>View Operator</h3>
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
<div class="">
				 
<div class="bs-component" ng-controller="listdata">
				
				
				<table class="table table-striped table-hover" id="example">
					<thead>
						<tr>
							<th>#</th>
							<th>Employee Code&nbsp;</th>
                            <th>Employee Name</th>
                            <th>Gender</th>
                            <th>Mobile</th>
                            <th>View</th>
                            <th>Upload</th>
			           </tr>
                   </thead>
				
                
<tbody>
<?php $i=1;
foreach($this->User_model->getemployees(2) as $emp)
{?>
<tr id="r2">
<td><?php echo $i++;?></td>
<td><?php echo $emp->employee_code?></td>
<td><?php echo $emp->employee_name?></td>
<td><?php echo $emp->gender?></td>
<td><?php echo $emp->mobile?></td>
<td>
		<a class="btn btn-primary btn-sm" href="<?php echo base_url();?>user/viewservicebook/<?php echo $emp->emp_id?>"><span class="glyphicon glyphicon-eye-open"></span> SB</a>

		<a class="btn btn-primary btn-sm" href="<?php echo base_url();?>user/viewleavereports/<?php echo $emp->emp_id?>"><span class="glyphicon glyphicon-eye-open"></span> LR</a>

		<a class="btn btn-primary btn-sm" href="<?php echo base_url();?>user/viewapar/<?php echo $emp->emp_id?>"><span class="glyphicon glyphicon-eye-open"></span> APAR</a>

    <a class="btn btn-primary btn-sm" href="<?php echo base_url();?>user/viewsr/<?php echo $emp->emp_id?>"><span class="glyphicon glyphicon-eye-open"></span> Attachments</a>

</td>
<td> 


<a class="btn btn-success btn-sm" href="<?php echo base_url();?>user/uploadservices/<?php echo $emp->emp_id?>"><span class="glyphicon glyphicon-cloud-upload"></span> SB</a>


<a class="btn btn-success btn-sm" href="<?php echo base_url();?>user/upload_emp_lr/<?php echo $emp->emp_id?>"><span class="glyphicon glyphicon-cloud-upload"></span> LR</a>

<a class="btn btn-success btn-sm" href="<?php echo base_url();?>user/upload_apar/<?php echo $emp->emp_id?>"><span class="glyphicon glyphicon-cloud-upload"></span> Apar</a>

<a class="btn btn-success btn-sm" href="<?php echo base_url();?>user/upload_sr/<?php echo $emp->emp_id?>"><span class="glyphicon glyphicon-cloud-upload"></span> Attachments</a>

     



<?php if($this->session->userdata("user_type")=='Admin' || $this->session->userdata("user_type")=='Supervisor')
{?>

<a class="btn btn-success btn-sm" href="<?php echo base_url();?>user/edit_employee/<?php echo $emp->emp_id?>">
<span class="glyphicon glyphicon-edit"> </span> Edit</a>



<a href="<?php echo base_url();?>user/deleteemp/<?php echo $emp->emp_id ?>/2" onClick="return confirm('Do you really want to delete?')" class="btn btn-danger btn-sm">Delete</a>
<?php } ?>				</td></tr><?php  } ?></tbody></table>
</div></div></div>
            </div>
          </div>
        </div>
		
	
		<script>
		$(document).ready(function() {
    $('#example').DataTable( {
       "order": [[ 0, "asc" ]]
    } );
} );
</script>
		




