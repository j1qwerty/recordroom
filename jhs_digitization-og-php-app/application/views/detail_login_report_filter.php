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

.nopadding{
	padding:0px;
}

.nomargin{
	margin:0px;
}

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

</style>
<?php 
//echo '<pre>';
//print_r($Report);
//exit;
?>
<div class="right_col">
	<div class="page-title">
	  <div class="title_left">
		<h3>Detail Login Report</h3>
	  </div>
	</div>
	<div class="row">
		<div class="col-md-12 col-sm-12 col-xs-12">
			<div class="x_panel">
				<div class="x_title">
					<h2>Detail Login Report</h2>
					<div class="clearfix"></div>
				</div>
				<div class="x_content">
					<div class="col-md-12">&nbsp;</div>
					<form name="myformlogin" id="myformlogin" action="<?php echo base_url();?>user/detail_login_report_filter" method="post">
						<div class="col-md-6 nopadding">
							<label>Duration</label>
							<div class="col-md-12 nopadding">
							<div class="col-md-6 nopadding">
								<input type="text" name="startdate" id="startdate" placeholder="Start Date" value="<?php echo date("Y-m-d", strtotime("-6 months"));?>" class="form-control" />
							</div>
							<div class="col-md-6">
								<input type="text" name="enddate" id="enddate" placeholder="End Date" value="<?php echo date("Y-m-d");?>" class="form-control" />
							</div>
							</div>
						</div>
						<div class="col-md-4">
							<label>Department</label>
							<div class="col-md-12 nopadding">
								<select name="department" id="department" class="form-control">
									<option value="all" <?php if($selecteddep=='all'){echo 'selected=selected';}else{echo '';}?>>All Department</option>
									<?php foreach($departmentlist as $dep){?>
									<option value="<?php echo $dep->id?>" <?php if($selecteddep==$dep->id){echo 'selected=selected';}else{echo '';}?>><?php echo $dep->name;?></option>
									<?php }?>
								</select>
							</div>
						</div>
						<div class="col-md-2 nopadding">
							<div class="col-md-12 nopadding">
							<input type="hidden" name="userid" id="userid" value="<?php echo $this->uri->segment(3);?>" />
							&nbsp;<input type="submit" name="search" class="btn btn-success" style="margin-top:14%;" id="search" value="Search" />
							</div>
						</div>
					</form>
					<div class="col-md-12">&nbsp;</div>
					<div class="col-md-12">
						<?php 
							if(isset($selecteddepsearch)){
								$seldepart = $selecteddepsearch;
							}else{
								$seldepart = 'all';
							}
							
							if(isset($startdate)){$startdate = $startdate;}else{$startdate = date("Y-m-d", strtotime("-6 months"));}
							if(isset($enddate)){$enddate = $enddate;}else{$enddate = date("Y-m-d");}
							if(isset($userid)){$userid = $userid;}
						?>
						<a href="<?php echo base_url();?>user/getDetailLoginHistoryExcelFile/<?php echo $startdate; ?>/<?php echo $enddate; ?>/<?php echo $seldepart; ?>/<?php echo $userid; ?>">Excel Report</a>
					</div>
					<div class="col-md-12">&nbsp;</div>
					<?php if(!empty($Report)){?>
					<table id="example" class="table table-striped table-bordered" style="width:100%">
						<thead>
							<tr>
								<th>Sr. No.</th>
								<th>Name</th>
								<th>Department</th>
								<th>Designation</th>
								<th>Role</th>
								<th>Website</th>
								<th>Mobile</th>
								<th>Login Time</th>
							</tr>
						</thead>
						<tbody>
							<?php 
							$i=1;
							foreach($Report as $reportlogin){
								if($reportlogin->user_name=='admin'){
									
									$empname = 'Admin';
									$department_name = 'Admin';
									$designation_name = 'Admin';
									$role = 'Admin';
								
								}else{
									
									$userdetail = $this->User_model->getUserDetailByID($reportlogin->user_id);
									$department = $this->User_model->getDepartmentNamebyID($userdetail[0]->emp_department);
									$designation = $this->User_model->getDesignationNamebyID($userdetail[0]->emp_designation);
									
									if ($userdetail[0]->role == 1) {
										$role = 'Supervisor';
									} elseif ($userdetail[0]->role == 2) {
										$role = 'Operator';
									} elseif ($userdetail[0]->role == 3) {
										$role = 'Employee';
									} elseif ($userdetail[0]->role == 4) {
										$role = 'Verifier';
									} else {
										$role = 'Admin';
									}
									
									$empname = $userdetail[0]->employee_name;
									$department_name = $department[0]->name;
									$designation_name = $designation[0]->name;
								}
								$logincount = $this->User_model->getTotalLoginCount($reportlogin->user_id);
							?>
							<tr>
								<td><?php echo $i;?></td>
								<td><?php echo $empname;?></td>
								<td><?php echo $department_name; ?></td>
								<td><?php echo $designation_name;?></td>
								<td><?php echo $role;?></td>
								<td><?php if($reportlogin->web==1){echo 'Yes';}else{echo 'No';} ?></td>
								<td><?php if($reportlogin->mobile==1){echo 'Yes';}else{echo 'No';} ?></td>
								<td><?php echo date('F,j Y - H:i A', strtotime($reportlogin->login_time));?></td>								
							</tr>
							<?php $i++;}?>
						</tbody>
						<tfoot>
							<tr>
								<th>Sr. No.</th>
								<th>Name</th>
								<th>Department</th>
								<th>Designation</th>
								<th>Role</th>
								<th>Website</th>
								<th>Mobile</th>
								<th>Login Time</th>
							</tr>
						</tfoot>
					</table>
					<div class="pagination"><?php echo $links; ?></div>
					<?php }else{?>
					<p>No record found.</p>
					<?php }?>
				</div>
			</div>
		</div>
	</div>
</div>