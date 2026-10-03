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

.buttons-flash {
	color: #fff;
    background-color: #398439;
}

.buttons-flash:hover {
	color: #fff;
}

</style>
<div class="right_col">
	<div class="">
		<div class="page-title">
		  <div class="title_left">
			<h3>Bulk Upload</h3>
		  </div>
		</div>
		<div class="clearfix"></div>
		<?php
		 if($this->session->flashdata('item') != '') {
			$message = $this->session->flashdata('item');
		?>
		<div class="alert alert-<?php echo $message['class'] ?>"><?php echo $message['message']; ?> </div>
        <?php }?>
        <div class="row">
			<div class="col-md-12 col-sm-12 col-xs-12">
				<div class="x_panel">
                  <div class="x_title">
                    <h2><?php if(!empty($Report)) { echo 'Report'; } else { echo 'Bulk Upload'; } ?></h2>                   
                    <div class="clearfix"></div>
                  </div>
                  <div class="x_content">
                  	<?php if(!empty($Report)) { ?>
                  	 <table class="table">
			            <thead>
			                <tr>
			                	<th>SUCCESS <span class="badge"><?php echo $Report['success_count']; ?></span></th>
			                	<th></th>
			                	<th>FAIL <span class="badge"><?php echo $Report['fail_count']; ?></span></th>
			                	<th></th>
			                </tr>
			            </thead>
			         </table>
                  		<!--<form class="falanae" action="<?php echo base_url();?>user/move_folders" method="post"> -->
					<div class="item form-group" style="margin-top:1%;">			               
						<table class="table table-striped" id="example">
							<thead>
								<tr>
									<th>Emp Code</th>
									<th>Status</th>
									<th width="40%">Errors</th>								
								</tr>
							</thead>
							<tbody>
								<?php if(!empty($Report['failed'])) { foreach ($Report['failed'] as $value) { ?>
								<tr>
									<td><?php echo $value; ?></td>
									<td><span class="label label-danger"><?php echo "Failed"; ?></span></td>
									<td><?php echo "PF no. does not exist"; ?></td>
								</tr>
								<?php } } ?>
								<?php if(!empty($Report['exist'])) { foreach ($Report['exist'] as $value) { ?>
								<tr>
									<td><?php echo $value; ?></td>
									<td><span class="label label-danger"><?php echo "Failed"; ?></span></td>
									<td><?php echo "PF No. already exist in uploads"; ?></td>
								</tr>
								<?php } } ?>
								<?php if(!empty($Report['nofolder'])) { foreach ($Report['nofolder'] as $value) { ?>
								<tr>
									<td><?php echo $value; ?></td>
									<td><span class="label label-danger"><?php echo "Failed"; ?></span></td>
									<td><?php echo "SR/LR/APAR/Attachment folder not found"; ?></td>
								</tr>
								<?php } } ?>
								<?php if(!empty($Report['success'])) { foreach ($Report['success'] as $key => $value) { ?>
								<tr>
									<td><?php echo $key; ?></td>
									<td><span class="label label-success"><?php echo "Success"; ?></span></td>
									<td><?php if(!empty($value)) { echo implode(', <br>  ', $value); } ?></td>
								</tr>
								<?php } } ?>
							</tbody>
						</table>
					</div>
                  	<?php } else { ?>
					<div class="col-md-12" style="padding-left:0px;padding-top:1%;">
						<div class="text-left">Total no. of PF folders <span class="badge"><?php echo (empty($filecount) ? 0 : $filecount); ?></span></div>
					</div>
					<div class="col-md-3" style="padding-left:0px;padding-top:1%;">
						<form class="falanae" action="<?php echo base_url();?>user/rename_files_folders" method="post">
							<div class="item form-group" style="margin-top:1%;">	
								<input type="hidden" name="compress" id="compress" value="FALSE" />
								<button id="send" type="submit" class="btn btn-block btn-success">Process</button>
							</div>
						</form>
					</div>
					<div class="col-md-1 text-center" style="padding-top:2%;">&nbsp;OR&nbsp;</div>
					<div class="col-md-3" style="padding-top:1%;">
						<form class="falanae" action="<?php echo base_url();?>user/rename_files_folders" method="post">
							<div class="item form-group" style="margin-top:1%;">
								<input type="hidden" name="compress" id="compress" value="TRUE" />
								<button id="send" type="submit" class="btn btn-block btn-success">Compress with process</button>
							</div>
						</form>
					</div>
	            	<?php } ?>
            	</div>
			</div>
          </div>
      </div>
    </div>
</div>
<script>
$(document).ready(function() {
    $('#example').DataTable( {
       "sorting": false,
       "bLengthChange": false,
       "paging":false,
       "ordering": false,
      	"info": false,
      	dom: 'Bfrtip',
      	buttons: [
          {  
            extend:'excel', text:'Export to Excel'
          }
        ]
    } );

    $('.dt-button').addClass('btn btn-primary btn-sm');
});
</script>
		
	

		




