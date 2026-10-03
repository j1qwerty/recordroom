<script src="<?php echo base_url(); ?>js/dataTables.min.js"></script>
<script src="<?php echo base_url(); ?>js/dataTables.min.js"></script>
<script src="<?php echo base_url(); ?>js/dataTables.bootstrap.min.js"></script>
<link rel="stylesheet" href="<?php echo base_url(); ?>css/dataTables.bootstrap.min.css">
<link rel="stylesheet" href="//code.jquery.com/ui/1.12.1/themes/base/jquery-ui.css">
<script src="https://code.jquery.com/ui/1.12.1/jquery-ui.js"></script>
<script>
  $( function() {
    $( "#startdate" ).datepicker({
		numberOfMonths: 1,
		dateFormat: 'yy-mm-dd',
        onSelect: function (selected) {
            var dt = new Date(selected);
            dt.setDate(dt.getDate() + 1);
            $("#enddate").datepicker("option", "minDate", dt);
        }
	});
	$( "#enddate" ).datepicker({
        numberOfMonths: 1,
		dateFormat: 'yy-mm-dd',
        onSelect: function (selected) {
            var dt = new Date(selected);
            dt.setDate(dt.getDate() - 1);
            $("#startdate").datepicker("option", "maxDate", dt);
		}
	});
  } );
  </script>
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
		<h3>Mobile Registration Report</h3>
	  </div>
	</div>
	<div class="row">
		<div class="col-md-12 col-sm-12 col-xs-12">
			<div class="x_panel">
				<div class="x_title">
					<h2>Mobile Registration Report</h2>
					<div class="clearfix"></div>
				</div>
				<div class="x_content">
					<div class="col-md-12">&nbsp;</div>
						
						<div class="col-md-12">&nbsp;</div>
						<div class="col-md-12">
							
							<a href="<?php echo base_url();?>user/getmobRegFile">Excel Report</a>
						</div>
						<div class="col-md-12">&nbsp;</div>
				
					<?php if(!empty($Report)){?>
					<table id="example" class="table table-striped table-bordered" style="width:100%">
						<thead>
							<tr>
								<th>Sr. No.</th>
								<th>Department</th>
								<th>Employee Name / Designation / DOB</th>
								<th>Pf. No.</th>
							</tr>
						</thead>
						<tbody>
							<?php 
							$i=1;
							foreach($Report as $reportlogin){
															$fathername = '';
										                	$dob = 'NOT AVAILABLE';
										                	$fathername = $reportlogin->fathername;
										                	if($fathername){
										                		$fathername = ' S/O '.$fathername;  
																			}
							                            	if(!empty($reportlogin->dob)) {
																$dob = date('d M Y',strtotime($reportlogin->dob));
															}
                                                            $department = $this->User_model->getDepartmentNamebyID($reportlogin->emp_department);
                                                            $designation = $this->User_model->getDesignationNamebyID($reportlogin->emp_designation);

                                                            $empname = $reportlogin->employee_name;
                                                            $department_name = @$department[0]->name;
                                                            $designation_name = @$designation[0]->name;
                                                            $pf_number = $reportlogin->employee_code;
							
							?>
							<tr>
                                                            <td><?php echo ++$page;?></td>
                                                            <td><?php echo $department_name; ?></td>
                                                            <td><?php echo $empname.$fathername ?> / <?php echo $designation_name;?> / <?php echo $dob; ?></td>
                                                            <!--<td><?php // echo $pf_number;?></td>-->
                                                            <!--by Preeti - 29-07-2019-->
                                                            <td><a href="<?php echo base_url() . 'user/search_employee/' . $pf_number; ?>" title="View Detail"><?php echo $pf_number; ?></a></td>
                                                        </tr>
							<?php $i++;}?>
						</tbody>
						<tfoot>
							<tr>
								<th>Sr. No.</th>
								<th>Department</th>
								<th>Employee Name / Designation / DOB</th>
								<th>Pf. No.</th>
							</tr>
						</tfoot>
					</table>
					<div class="col-md-6">
						<div class="pagination"><?php echo $links; ?></div>
					</div>
					<div class="col-md-6">
						<span class="pull-right" style="margin-top: 25px;">Showing <?= count($Report) ?> of <?= $total_rows ?> records</span>
					</div>
					<?php }else{?>
					<p>No record found.</p>
					<?php }?>
				</div>
			</div>
		</div>
	</div>
</div>