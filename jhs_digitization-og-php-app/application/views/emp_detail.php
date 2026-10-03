<script src="<?php echo base_url(); ?>js/dataTables.min.js"></script>
<script src="<?php echo base_url(); ?>js/dataTables.min.js"></script>
<script src="<?php echo base_url(); ?>js/dataTables.bootstrap.min.js"></script>
<link rel="stylesheet" href="<?php echo base_url(); ?>css/dataTables.bootstrap.min.css">
<style>

/*pagination*/
.pagination > a, .pagination > strong{
  position: relative;
  float: left;
  padding: 6px 12px;
  margin-left: -1px;
  line-height: 1.42857143;
  color: #337ab7;
  text-decoration: none;
  background-color: #fff;
  border: 1px solid #ddd;
}
.pagination> a:focus, .pagination> a:hover, .pagination > strong:focus, .pagination > strong:hover {
  z-index: 2;
  color: #23527c;
  background-color: #eee;
  border-color: #ddd;
}
.pagination > strong {
  background: #337ab7;
  color: #fff;
  border: 1px solid #337ab7;
}
/*pagination*/

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

.not-active {
  pointer-events: none;
  cursor: default;
  text-decoration: none;
  color: black;
}

</style>
<div class="right_col">
          <div class="">
            <div class="page-title">
              <div class="title_left">
                <h3>Search Employee</h3>
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
    <form class="falanae" action="<?php echo base_url();?>record/search_emp" name="employeeform" method="post">
        <div class="item form-group" style="margin-top:1%;">
                        
            <div class="col-sm-4" style="padding-left:0px;">
              <input id="search" class="form-control" value="<?php echo $search['search'] ?>" name="search" placeholder="Enter Employee/Emp. Code" type="text">
              <?php echo form_error('search'); ?>  
            </div>
             <button id="send" type="submit" class="btn btn-success">Search</button>
        </div>
    </form>
        <div class="">         
            <?php if(!empty($employees)){?>
          <table id="example" class="table table-striped table-bordered" style="width:100%">
            <thead>
              <tr>
                <th>#</th>
                <th width="15%">Employee Code</th>
                <th width="15%">Employee Name / DOB</th>
                <th>Designation</th>
                <th>Mobile</th>
                <!--<th>View</th>-->
                <?php // if($this->session->userdata("user_type")!='Verifier') { ?>
                  <!--<th>Upload</th>-->
                <?php // } ?>
              </tr>
            </thead>
            <tbody>
             <?php $i=1;
              if(!empty($employees)) {
                foreach($employees as $emp) { 
                		$fathername = '';
	                	$dob = 'NOT AVAILABLE';
	                	$fathername = $emp->fathername;
	                	if($fathername){
	                		$fathername = ' S/O '.$fathername;  
										}
										if(!empty($emp->dob)) {
											$dob = date('d M Y',strtotime($emp->dob));
										}
                	?>
                  <tr id="r2">
                    <td><?php echo ++$page;?></td>
                    <td><?php echo $emp->employee_code?></td>
                    <td><?php echo $emp->employee_name.$fathername?> / <?php echo $dob?></td>
                    <td><?php echo $emp->designation?></td>
                    <td><?php echo $emp->mobile?></td>
                    <!--<td>-->
                      
<!--                      <a class="btn btn-primary btn-sm <?php // if(count($this->User_model->getallservicebook($emp->emp_id)) == 0) echo 'not-active'; ?>" href="<?php // echo base_url();?>user/viewservicebook/<?php // echo $emp->emp_id?>"><span class="glyphicon glyphicon-eye-open"></span> SB (<?php // echo count($this->User_model->getallservicebook($emp->emp_id)); ?>)</a>
                      <a class="btn btn-primary btn-sm <?php // if(count($this->User_model->getLRdetail($emp->emp_id)) == 0) echo 'not-active'; ?>" href="<?php // echo base_url();?>user/viewleavereports/<?php // echo $emp->emp_id?>"><span class="glyphicon glyphicon-eye-open"></span> LR (<?php // $lr=$this->User_model->getLRdetail($emp->emp_id); echo count($lr); ?>)</a>
                      <a class="btn btn-primary btn-sm <?php // if(count($this->User_model->getallsessions($emp->emp_id)) == 0) echo 'not-active'; ?>" href="<?php // echo base_url();?>user/viewapar/<?php // echo $emp->emp_id?>"><span class="glyphicon glyphicon-eye-open"></span> APAR (<?php // echo count($this->User_model->getallsessions($emp->emp_id)); ?>)</a>

                      <a class="btn btn-primary btn-sm <?php // if(count($this->User_model->getSRdetail($emp->emp_id)) == 0) echo 'not-active'; ?>" href="<?php // echo base_url();?>user/viewsr/<?php // echo $emp->emp_id?>"><span class="glyphicon glyphicon-eye-open"></span> Attachments (<?php // echo count($this->User_model->getSRdetail($emp->emp_id)); ?>)</a>
                      
                      <a class="btn btn-primary btn-sm" href="<?php // echo base_url();?>user/view_report_log/<?php // echo $emp->emp_id?>"><span class="glyphicon glyphicon-eye-open"></span> Report Log </a>
                      <a class="btn btn-primary btn-sm <?php // if(count($this->User_model->getallservicebook($emp->emp_id)) == 0) echo 'not-active'; ?>" href="<?php // echo base_url();?>user/view_sr_book/<?php // echo $emp->emp_id?>"><span class="glyphicon glyphicon-eye-open"></span> Book View (<?php // echo count($this->User_model->getallservicebook($emp->emp_id)); ?>)</a>-->
                      
                    <!--</td>-->

                    <?php // if($this->session->userdata("user_type")!='Verifier') { ?>
                      <!--<td>--> 

<!--                        <a class="btn btn-success btn-sm" href="<?php // echo base_url();?>user/uploadservices/<?php // echo $emp->emp_id?>"><span class="glyphicon glyphicon-cloud-upload"></span> SB</a>


                        <a class="btn btn-success btn-sm" href="<?php // echo base_url();?>user/upload_emp_lr/<?php // echo $emp->emp_id?>"><span class="glyphicon glyphicon-cloud-upload"></span> LR</a>

                        <a class="btn btn-success btn-sm" href="<?php // echo base_url();?>user/upload_apar/<?php // echo $emp->emp_id?>"><span class="glyphicon glyphicon-cloud-upload"></span> APAR</a>

                        <a class="btn btn-success btn-sm" href="<?php // echo base_url();?>user/upload_sr/<?php // echo $emp->emp_id?>"><span class="glyphicon glyphicon-cloud-upload"></span> Attachments</a>-->

                        <?php // if($this->session->userdata("user_type")=='Admin' || $this->session->userdata("user_type")=='Supervisor')
//                        {?>
<!--                          <a class="btn btn-success btn-sm" href="<?php // echo base_url();?>user/edit_employee/<?php // echo $emp->emp_id?>">
                            <span class="glyphicon glyphicon-edit"> </span> Edit</a>
                            <a href="<?php // echo base_url();?>user/deleteemp/<?php // echo $emp->emp_id ?>/3" onClick="return confirm('Do you really want to delete?')" class="btn btn-danger btn-sm">Delete</a>-->
                          <?php // } ?>  
                        <!--</td>-->

                      <?php // } ?>

                      </tr><?php }  } ?>
            </tbody>
            <tfoot>
              <tr>
                <th>#</th>
                <th width="15%">Employee Code</th>
                <th width="15%">Employee Name / DOB</th>
                <th>Designation</th>
                <th>Mobile</th>
                <!--<th>View</th>-->
                <?php // if($this->session->userdata("user_type")!='Verifier') { ?>
                  <!--<th>Upload</th>-->
                <?php // } ?>
              </tr>
            </tfoot>
          </table>
          <div class="col-md-6">
          	<div class="pagination"><?php echo $links; ?></div>
        	</div>
          <div class="col-md-6">
	          	<span class="pull-right" style="margin-top: 25px;">Showing <?= count($employees) ?> of <?= $total_rows ?> records</span>
          </div>
          <?php }else{?>
          <p>No record found.</p>
          <?php }?>
        </div>
      </div>
    </div>
          </div>
        </div>
		
	

		




